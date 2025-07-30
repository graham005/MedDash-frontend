import React, { useState, useMemo, useEffect } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon,
  UserIcon,
  BeakerIcon,
  CubeIcon
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine } from '@/hooks/usePharmacy';
import { useCurrentUser } from '@/hooks/useAuth';
import type { Medicine } from '@/api/medicine';
import { PenIcon, Download } from 'lucide-react';

type ViewMode = 'cards' | 'table';

interface MedicineCardProps {
  medicine: Medicine;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
}

function MedicineCard({ medicine, onEdit, onDelete }: MedicineCardProps) {
  const expirationDate = new Date(medicine.expirationDate);
  const isExpiringSoon = isBefore(expirationDate, addDays(new Date(), 30));
  const isExpired = isBefore(expirationDate, new Date());
  const isLowStock = medicine.stock <= 10;

  const getStockStatus = () => {
    if (isExpired) return { text: 'Expired', color: 'bg-red-500' };
    if (isLowStock) return { text: 'Low Stock', color: 'bg-yellow-500' };
    if (isExpiringSoon) return { text: 'Expiring Soon', color: 'bg-orange-500' };
    return null;
  };

  const stockStatus = getStockStatus();

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('paracetamol') || lowerName.includes('ibuprofen')) {
      return <HeartIcon className="w-5 h-5 text-red-400" />;
    }
    if (lowerName.includes('antibiotic') || lowerName.includes('amoxicillin')) {
      return <BeakerIcon className="w-5 h-5 text-blue-400" />;
    }
    if (lowerName.includes('metformin') || lowerName.includes('diabetes')) {
      return <UserIcon className="w-5 h-5 text-green-400" />;
    }
    return <CubeIcon className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 dark:from-slate-800 dark:to-slate-900 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getCategoryIcon(medicine.name)}
            <div>
              <h3 className="font-semibold text-lg text-white truncate">
                {medicine.name} {medicine.dosage}
              </h3>
              <p className="text-indigo-200 dark:text-slate-300 text-sm">
                {medicine.manufacturer}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {stockStatus && (
              <Badge className={cn('text-xs font-medium px-2 py-1 text-white', stockStatus.color)}>
                {stockStatus.text}
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <DropdownMenuItem 
                  onClick={() => onEdit(medicine)}
                  className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(medicine.id)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-indigo-200 dark:text-slate-400 text-xs mb-1">Stock</p>
            <p className="text-2xl font-bold text-white">{medicine.stock}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 dark:text-slate-400 text-xs mb-1">Price</p>
            <p className="text-2xl font-bold text-white">Ksh{medicine.price.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-indigo-700 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-indigo-200 dark:text-slate-400 text-sm">
              Exp: {format(expirationDate, 'MM/yyyy')}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20 p-2"
              onClick={() => onEdit(medicine)}
            >
              <PenIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MedicineTableProps {
  medicines: Medicine[];
  selectedMedicines: string[];
  onSelectMedicine: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
}

function MedicineTable({ 
  medicines, 
  selectedMedicines, 
  onSelectMedicine, 
  onSelectAll, 
  onEdit, 
  onDelete 
}: MedicineTableProps) {
  const generateBatchNumber = (medicine: Medicine) => {
    const prefix = medicine.name.substring(0, 3).toUpperCase();
    const year = new Date(medicine.expirationDate).getFullYear();
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${prefix}-${year}-${randomNum}`;
  };

  const getStockStatus = (medicine: Medicine) => {
    const expirationDate = new Date(medicine.expirationDate);
    const isExpiringSoon = isBefore(expirationDate, addDays(new Date(), 30));
    const isExpired = isBefore(expirationDate, new Date());
    const isLowStock = medicine.stock <= 10;

    if (isExpired) return { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (isLowStock) return { text: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (isExpiringSoon) return { text: 'Expiring Soon', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { text: medicine.stock.toString() + ' tablets', color: 'text-gray-900', bgColor: 'bg-gray-50' };
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Table Header */}
      <div className="bg-indigo-600 dark:bg-indigo-700 text-white">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium">
          <div className="col-span-1">
            <Checkbox
              checked={selectedMedicines.length === medicines.length && medicines.length > 0}
              onCheckedChange={onSelectAll}
              className="border-white data-[state=checked]:bg-white data-[state=checked]:text-indigo-600"
            />
          </div>
          <div className="col-span-3">Medication Name</div>
          <div className="col-span-2">Batch Number</div>
          <div className="col-span-2">Stock Level</div>
          <div className="col-span-2">Expiry Date</div>
          <div className="col-span-1">Manufacturer</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200 dark:divide-slate-700">
        {medicines.map((medicine, index) => {
          const stockStatus = getStockStatus(medicine);
          const batchNumber = generateBatchNumber(medicine);
          const isSelected = selectedMedicines.includes(medicine.id);
          
          return (
            <div
              key={medicine.id}
              className={cn(
                "grid grid-cols-12 gap-4 px-6 py-4 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors",
                isSelected && "bg-indigo-50 dark:bg-indigo-900/20"
              )}
            >
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectMedicine(medicine.id)}
                  className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
              </div>
              
              <div className="col-span-3 flex items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {medicine.name} {medicine.dosage}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    Ksh{medicine.price.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2 flex items-center">
                <div className="font-mono text-gray-700 dark:text-gray-300">
                  {batchNumber}
                </div>
              </div>
              
              <div className="col-span-2 flex items-center">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  stockStatus.color,
                  stockStatus.bgColor
                )}>
                  {stockStatus.text}
                </span>
              </div>
              
              <div className="col-span-2 flex items-center">
                <div className="text-gray-700 dark:text-gray-300">
                  {format(new Date(medicine.expirationDate), 'yyyy-MM-dd')}
                </div>
              </div>
              
              <div className="col-span-1 flex items-center">
                <div className="text-gray-600 dark:text-gray-400 text-xs truncate">
                  {medicine.manufacturer}
                </div>
              </div>
              
              <div className="col-span-1 flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(medicine)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(medicine.id)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine?: Medicine | null;
  onSuccess: () => void;
}

function AddMedicineDialog({ open, onOpenChange, medicine, onSuccess }: AddMedicineDialogProps) {
  const [formData, setFormData] = useState({
    name: medicine?.name || '',
    dosage: medicine?.dosage || '',
    price: medicine?.price?.toString() || '',
    stock: medicine?.stock?.toString() || '',
    manufacturer: medicine?.manufacturer || '',
    expirationDate: medicine?.expirationDate ? format(new Date(medicine.expirationDate), 'yyyy-MM-dd') : ''
  });

  // Add this effect to update formData when medicine changes
  useEffect(() => {
    setFormData({
      name: medicine?.name || '',
      dosage: medicine?.dosage || '',
      price: medicine?.price?.toString() || '',
      stock: medicine?.stock?.toString() || '',
      manufacturer: medicine?.manufacturer || '',
      expirationDate: medicine?.expirationDate ? format(new Date(medicine.expirationDate), 'yyyy-MM-dd') : ''
    });
  }, [medicine, open]);

  const { mutate: createMedicine, isPending: isCreating } = useCreateMedicine();
  const { mutate: updateMedicine, isPending: isUpdating } = useUpdateMedicine();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const medicineData = {
      name: formData.name,
      dosage: formData.dosage,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      manufacturer: formData.manufacturer,
      expirationDate: new Date(formData.expirationDate)
    };

    if (medicine) {
      updateMedicine({
        id: medicine.id,
        data: medicineData
      }, {
        onSuccess: () => {
          onSuccess();
          onOpenChange(false);
        }
      });
    } else {
      createMedicine(medicineData, {
        onSuccess: () => {
          onSuccess();
          onOpenChange(false);
          setFormData({
            name: '',
            dosage: '',
            price: '',
            stock: '',
            manufacturer: '',
            expirationDate: ''
          });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border-gray-200 ">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {medicine ? 'Update medicine information' : 'Add a new medicine to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Medicine Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dosage" className="text-gray-700 dark:text-gray-300">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                required
                className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-gray-700 dark:text-gray-300">Price (KES)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="stock" className="text-gray-700 dark:text-gray-300">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="manufacturer" className="text-gray-700 dark:text-gray-300">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              required
              className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
            />
          </div>

          <div>
            <Label htmlFor="expirationDate" className="text-gray-700 dark:text-gray-300">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              required
              className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 mt-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isCreating || isUpdating ? 'Saving...' : medicine ? 'Update' : 'Add Medicine'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MedicineInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);

  const { data: medicines = [], isLoading, error, refetch } = useMedicines();
  const { mutate: deleteMedicine } = useDeleteMedicine();
  const { data: currentUser } = useCurrentUser();

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine => {
      const matchesSearch = searchQuery === '' || 
        medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || 
        (categoryFilter === 'prescription' && medicine.name.toLowerCase().includes('prescription')) ||
        (categoryFilter === 'health-care' && (medicine.name.toLowerCase().includes('paracetamol') || medicine.name.toLowerCase().includes('ibuprofen'))) ||
        (categoryFilter === 'baby-care' && medicine.name.toLowerCase().includes('baby')) ||
        (categoryFilter === 'personal-care' && medicine.name.toLowerCase().includes('personal'));

      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && medicine.stock <= 10) ||
        (stockFilter === 'normal' && medicine.stock > 10 && medicine.stock <= 100) ||
        (stockFilter === 'high' && medicine.stock > 100);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [medicines, searchQuery, categoryFilter, stockFilter]);

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      deleteMedicine(id);
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingMedicine(null);
  };

  const handleSelectMedicine = (id: string) => {
    setSelectedMedicines(prev => 
      prev.includes(id) 
        ? prev.filter(medicineId => medicineId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedMedicines(checked ? filteredMedicines.map(m => m.id) : []);
  };

  const exportToCSV = () => {
    const headers = ['Medicine Name', 'Dosage', 'Price', 'Stock', 'Manufacturer', 'Expiry Date'];
    const csvData = filteredMedicines.map(medicine => [
      medicine.name,
      medicine.dosage,
      medicine.price.toString(),
      medicine.stock.toString(),
      medicine.manufacturer,
      format(new Date(medicine.expirationDate), 'yyyy-MM-dd')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicine-inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-6 h-6 text-white" />
              </div>
              Pharmacy Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage medications, track stock levels, and monitor expiry dates
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search medicines, brands, or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="health-care">Health Care</SelectItem>
                    <SelectItem value="baby-care">Baby Care</SelectItem>
                    <SelectItem value="personal-care">Personal Care</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="low">Low Stock (≤10)</SelectItem>
                    <SelectItem value="normal">Normal (11-100)</SelectItem>
                    <SelectItem value="high">High Stock ({'>'}100)</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" className="border-gray-300 dark:border-slate-600">
                  <FunnelIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <CubeIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prescription</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <HeartIcon className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Health Care</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <UserIcon className="w-8 h-8 text-pink-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Baby Care</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <BeakerIcon className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Personal Care</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Medicine Inventory
            </h2>
            {viewMode === 'table' && selectedMedicines.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMedicines.length} item{selectedMedicines.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                onClick={() => setViewMode('cards')}
                className={cn(
                  "px-3 py-1.5 text-xs",
                  viewMode === 'cards' 
                    ? "bg-slate-600 dark:bg-slate-600 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Squares2X2Icon className="w-4 h-4 mr-1" />
                Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-3 py-1.5 text-xs",
                  viewMode === 'table' 
                    ? "bg-slate-600 dark:bg-slate-600 shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <TableCellsIcon className="w-4 h-4 mr-1" />
                Table
              </Button>
            </div>

            {/* Export and Add buttons */}
            <Button 
              onClick={exportToCSV}
              size="sm"
              variant="outline"
              className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>

        {/* Medicine Content */}
        {filteredMedicines.length === 0 ? (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="p-12 text-center">
              <CubeIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No medicines found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by adding your first medicine to the inventory.'}
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <MedicineTable
            medicines={filteredMedicines}
            selectedMedicines={selectedMedicines}
            onSelectMedicine={handleSelectMedicine}
            onSelectAll={handleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Add/Edit Medicine Dialog */}
        <AddMedicineDialog
          open={isAddDialogOpen}
          onOpenChange={handleDialogClose}
          medicine={editingMedicine}
          onSuccess={() => refetch()}
        />
      </div>
    </div>
  );
}