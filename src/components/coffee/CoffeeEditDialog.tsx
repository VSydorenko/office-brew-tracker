import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LookupItem {
  id: string;
  name: string;
}

interface CoffeeEditType {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  brand_id?: string;
  variety_id?: string;
  origin_id?: string;
  processing_method_id?: string;
}

interface CoffeeEditDialogProps {
  coffee: CoffeeEditType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CoffeeEditDialog = ({ coffee, open, onOpenChange, onSuccess }: CoffeeEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<LookupItem[]>([]);
  const [flavors, setFlavors] = useState<LookupItem[]>([]);
  const [processingMethods, setProcessingMethods] = useState<LookupItem[]>([]);
  const [varieties, setVarieties] = useState<LookupItem[]>([]);
  const [origins, setOrigins] = useState<LookupItem[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    brand_id: '',
    description: '',
    package_size: '',
    processing_method_id: '',
    variety_id: '',
    origin_id: '',
    flavor_ids: [] as string[],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchLookupData();
      initializeFormData();
    }
  }, [open, coffee]);

  const initializeFormData = async () => {
    // Fetch current coffee flavors
    const { data: coffeeFlavors } = await supabase
      .from('coffee_flavors')
      .select('flavor_id')
      .eq('coffee_type_id', coffee.id);

    setFormData({
      name: coffee.name || '',
      brand_id: coffee.brand_id || '',
      description: coffee.description || '',
      package_size: coffee.package_size || '',
      processing_method_id: coffee.processing_method_id || '',
      variety_id: coffee.variety_id || '',
      origin_id: coffee.origin_id || '',
      flavor_ids: coffeeFlavors?.map(cf => cf.flavor_id) || [],
    });
  };

  const fetchLookupData = async () => {
    try {
      const [brandsRes, flavorsRes, methodsRes, varietiesRes, originsRes] = await Promise.all([
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('flavors').select('id, name').order('name'),
        supabase.from('processing_methods').select('id, name').order('name'),
        supabase.from('coffee_varieties').select('id, name').order('name'),
        supabase.from('origins').select('id, name').order('name'),
      ]);

      if (brandsRes.error) throw brandsRes.error;
      if (flavorsRes.error) throw flavorsRes.error;
      if (methodsRes.error) throw methodsRes.error;
      if (varietiesRes.error) throw varietiesRes.error;
      if (originsRes.error) throw originsRes.error;

      setBrands(brandsRes.data || []);
      setFlavors(flavorsRes.data || []);
      setProcessingMethods(methodsRes.data || []);
      setVarieties(varietiesRes.data || []);
      setOrigins(originsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити довідники",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Помилка",
        description: "Назва кави є обов'язковою",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update coffee type
      const coffeeData = {
        name: formData.name,
        brand_id: formData.brand_id || null,
        description: formData.description,
        package_size: formData.package_size,
        processing_method_id: formData.processing_method_id || null,
        variety_id: formData.variety_id || null,
        origin_id: formData.origin_id || null,
        updated_at: new Date().toISOString(),
      };
      
      const { error: coffeeError } = await supabase
        .from('coffee_types')
        .update(coffeeData)
        .eq('id', coffee.id);

      if (coffeeError) throw coffeeError;

      // Delete existing flavors
      const { error: deleteError } = await supabase
        .from('coffee_flavors')
        .delete()
        .eq('coffee_type_id', coffee.id);

      if (deleteError) throw deleteError;

      // Insert new flavors if selected
      if (formData.flavor_ids.length > 0) {
        const flavorInserts = formData.flavor_ids.map(flavorId => ({
          coffee_type_id: coffee.id,
          flavor_id: flavorId,
        }));
        
        const { error: flavorError } = await supabase
          .from('coffee_flavors')
          .insert(flavorInserts);
          
        if (flavorError) throw flavorError;
      }

      toast({
        title: "Успіх",
        description: "Каву оновлено",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити каву",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlavorToggle = (flavorId: string) => {
    setFormData(prev => ({
      ...prev,
      flavor_ids: prev.flavor_ids.includes(flavorId)
        ? prev.flavor_ids.filter(id => id !== flavorId)
        : [...prev.flavor_ids, flavorId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Редагувати каву</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва кави *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Наприклад: Арабіка Гватемала"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Бренд</Label>
            <Select value={formData.brand_id} onValueChange={(value) => setFormData({ ...formData, brand_id: value === 'none' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть бренд" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без бренду</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variety">Різновид</Label>
            <Select value={formData.variety_id} onValueChange={(value) => setFormData({ ...formData, variety_id: value === 'none' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть різновид" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не вказано</SelectItem>
                {varieties.map((variety) => (
                  <SelectItem key={variety.id} value={variety.id}>
                    {variety.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin">Походження</Label>
            <Select value={formData.origin_id} onValueChange={(value) => setFormData({ ...formData, origin_id: value === 'none' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть походження" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не вказано</SelectItem>
                {origins.map((origin) => (
                  <SelectItem key={origin.id} value={origin.id}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processing">Обробка</Label>
            <Select value={formData.processing_method_id} onValueChange={(value) => setFormData({ ...formData, processing_method_id: value === 'none' ? '' : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть спосіб обробки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не вказано</SelectItem>
                {processingMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Смакові якості</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {flavors.map((flavor) => (
                <div key={flavor.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`flavor-${flavor.id}`}
                    checked={formData.flavor_ids.includes(flavor.id)}
                    onCheckedChange={() => handleFlavorToggle(flavor.id)}
                  />
                  <Label htmlFor={`flavor-${flavor.id}`} className="text-sm">
                    {flavor.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="package_size">Розмір упаковки</Label>
            <Input
              id="package_size"
              value={formData.package_size}
              onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
              placeholder="Наприклад: 1 кг"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Додатковий опис кави..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-coffee"
            >
              {loading ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};