import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface LookupItem {
  id: string;
  name: string;
}

interface CoffeeFormProps {
  onSuccess?: () => void;
  children?: ReactNode;
}

export const CoffeeForm = ({ onSuccess, children }: CoffeeFormProps) => {
  const [open, setOpen] = useState(false);
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
    fetchLookupData();
  }, []);

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
      
      // Insert coffee type
      const coffeeData = {
        name: formData.name,
        brand_id: formData.brand_id || null,
        description: formData.description,
        package_size: formData.package_size,
        processing_method_id: formData.processing_method_id || null,
        variety_id: formData.variety_id || null,
        origin_id: formData.origin_id || null,
      };
      
      const { data: coffeeResult, error: coffeeError } = await supabase
        .from('coffee_types')
        .insert([coffeeData])
        .select('id')
        .single();

      if (coffeeError) throw coffeeError;

      // Insert flavors if selected
      if (formData.flavor_ids.length > 0 && coffeeResult?.id) {
        const flavorInserts = formData.flavor_ids.map(flavorId => ({
          coffee_type_id: coffeeResult.id,
          flavor_id: flavorId,
        }));
        
        const { error: flavorError } = await supabase
          .from('coffee_flavors')
          .insert(flavorInserts);
          
        if (flavorError) throw flavorError;
      }

      toast({
        title: "Успіх",
        description: "Кава додана до каталогу",
      });

      setFormData({ 
        name: '', 
        brand_id: '', 
        description: '', 
        package_size: '',
        processing_method_id: '',
        variety_id: '',
        origin_id: '',
        flavor_ids: []
      });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати каву",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children as React.ReactElement
        ) : (
          <Button className="bg-gradient-coffee shadow-brew">
            <Plus className="h-4 w-4 mr-2" />
            Додати каву
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary">Додати новий тип кави</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-20">
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

          </form>
        </div>

        {/* Sticky footer з кнопками */}
        <div className="border-t bg-background p-4 mt-auto">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-coffee"
              onClick={handleSubmit}
            >
              {loading ? 'Збереження...' : 'Додати каву'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};