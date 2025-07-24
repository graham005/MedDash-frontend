import { useParams, useNavigate } from "@tanstack/react-router";
import { usePayment, useCancelPayment, useRefundPayment } from "@/hooks/usePayments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowLeftIcon, RotateCcw, XCircle } from "lucide-react";

export default function PaymentDetails() {
  const { paymentId } = useParams({ strict: false });
  const { data: payment, isLoading } = usePayment(paymentId ?? "");
  const cancelPayment = useCancelPayment();
  const refundPayment = useRefundPayment();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center py-8 text-indigo-400">Loading payment details...</div>
      </div>
    );
  }
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center py-8 text-red-400">Payment not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="bg-[#0a1557] text-white px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white"
            onClick={() => navigate({ to: "/dashboard/admin/payments" })}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
        </div>
        <div>
          {payment.status === "refunded" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900 text-white text-xs font-semibold">
              <RotateCcw className="w-4 h-4" />
              Refunded
            </span>
          )}
          {payment.status === "failed" && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
              <XCircle className="w-4 h-4" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-3xl mx-auto mt-10 mb-8 px-2">
        <Card className="bg-white dark:bg-slate-900 border-1 shadow-lg">
          <CardHeader className="border-1 rounded-md pt-2 pb-2 max-w-sm ml-5">
            <CardTitle className="text-indigo-900 dark:text-indigo-100  flex items-center gap-2">
              Payment Info
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Details and actions for this payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Patient Name</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{payment.fullName}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Service Type</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {payment.type === "appointment" ? "Consultation" : "Prescription"}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  KES {Number(payment.amount).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                  {payment.status}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {format(new Date(payment.createdAt), "yyyy-MM-dd")}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <Button
                variant="outline"
                className="flex-1"
                disabled={payment.status !== "pending" || cancelPayment.isPending}
                onClick={() => cancelPayment.mutate(payment.id)}
              >
                Cancel Payment
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={payment.status !== "success" || refundPayment.isPending}
                onClick={() => refundPayment.mutate(payment.id)}
              >
                Refund Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}