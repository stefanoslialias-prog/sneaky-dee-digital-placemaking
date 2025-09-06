
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash, X } from 'lucide-react';
import { Question } from '@/hooks/useQuestionManager';
import { supabase } from '@/integrations/supabase/client';

interface Partner {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface QuestionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentQuestion: Question | null;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

const questionTypes = [
  { value: 'sentiment', label: 'Sentiment (Happy/Neutral/Concerned)' },
  { value: 'text', label: 'Text Response' },
  { value: 'multiple_choice', label: 'Multiple Choice' }
];

const QuestionDialog: React.FC<QuestionDialogProps> = ({
  isOpen,
  onOpenChange,
  currentQuestion,
  setCurrentQuestion,
  onSave,
  onDelete,
  isSaving,
  isDeleting
}) => {
  const [partners, setPartners] = useState<Partner[]>([]);

  // Fetch partners for dropdown
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, slug, active')
          .eq('active', true)
          .order('name');
        
        if (error) throw error;
        setPartners(data || []);
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
    };
    
    fetchPartners();
  }, []);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {currentQuestion?.id ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
          <DialogDescription>
            {currentQuestion?.id 
              ? 'Make changes to this survey question'
              : 'Create a new question to display to community members'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="question-text">Question Text</Label>
            <Textarea
              id="question-text"
              value={currentQuestion?.text || ''}
              onChange={e => setCurrentQuestion(prev => 
                prev ? { ...prev, text: e.target.value } : null
              )}
              placeholder="How do you feel about the WiFi service today?"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="question-type">Question Type</Label>
            <Select
              value={currentQuestion?.type || 'sentiment'}
              onValueChange={value => setCurrentQuestion(prev => 
                prev ? { ...prev, type: value } : null
              )}
            >
              <SelectTrigger id="question-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {questionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="question-order">Order</Label>
            <Input
              id="question-order"
              type="number"
              value={currentQuestion?.order || 1}
              onChange={e => setCurrentQuestion(prev => 
                prev ? { ...prev, order: parseInt(e.target.value) || 1 } : null
              )}
              min={1}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="partner">Partner (Optional)</Label>
            <Select
              value={currentQuestion?.partner_id || 'none'}
              onValueChange={value => setCurrentQuestion(prev => 
                prev ? { ...prev, partner_id: value === 'none' ? undefined : value } : null
              )}
            >
              <SelectTrigger id="partner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">No Partner (Global)</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div>
            {currentQuestion?.id && (
              <Button 
                variant="destructive" 
                onClick={onDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
                {!isDeleting && <Trash className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Cancel
              <X className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={onSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Saving...' : 'Save'}
              {!isSaving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;
