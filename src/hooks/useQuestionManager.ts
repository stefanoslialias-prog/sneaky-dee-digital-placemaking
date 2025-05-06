
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Question {
  id: string;
  text: string;
  type: string;
  order: number;
  active: boolean;
}

export const useQuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('survey_questions')
        .select('*')
        .order('order', { ascending: true });
        
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load survey questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newOrder = questions.length > 0 
      ? Math.max(...questions.map(q => q.order)) + 1 
      : 1;
      
    setCurrentQuestion({
      id: '',
      text: '',
      type: 'sentiment',
      order: newOrder,
      active: true
    });
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion({ ...question });
    setIsDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    try {
      if (!currentQuestion) return;
      if (!currentQuestion.text.trim()) {
        toast.error('Question text cannot be empty');
        return;
      }
      
      setIsSaving(true);
      
      // Determine if this is an update or insert
      if (currentQuestion.id) {
        const { error } = await supabase
          .from('survey_questions')
          .update({
            text: currentQuestion.text,
            type: currentQuestion.type,
            order: currentQuestion.order,
            active: currentQuestion.active
          })
          .eq('id', currentQuestion.id);
          
        if (error) throw error;
        toast.success('Question updated successfully');
      } else {
        const { error } = await supabase
          .from('survey_questions')
          .insert({
            text: currentQuestion.text,
            type: currentQuestion.type,
            order: currentQuestion.order,
            active: true
          });
          
        if (error) throw error;
        toast.success('Question added successfully');
      }
      
      setIsDialogOpen(false);
      await fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      if (!currentQuestion?.id) return;
      
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('survey_questions')
        .delete()
        .eq('id', currentQuestion.id);
        
      if (error) throw error;
      
      toast.success('Question deleted');
      setIsDialogOpen(false);
      await fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    try {
      const index = questions.findIndex(q => q.id === questionId);
      if (index === -1) return;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= questions.length) return;
      
      const questionToMove = questions[index];
      const questionToSwap = questions[newIndex];
      
      // Update the orders in the database
      const updates = [
        {
          id: questionToMove.id,
          order: questionToSwap.order
        },
        {
          id: questionToSwap.id,
          order: questionToMove.order
        }
      ];
      
      for (const update of updates) {
        await supabase
          .from('survey_questions')
          .update({ order: update.order })
          .eq('id', update.id);
      }
      
      await fetchQuestions();
    } catch (error) {
      console.error('Error moving question:', error);
      toast.error('Failed to reorder questions');
    }
  };

  const toggleQuestionActive = async (questionId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('survey_questions')
        .update({ active: !currentActive })
        .eq('id', questionId);
        
      if (error) throw error;
      
      await fetchQuestions();
      toast.success(`Question ${!currentActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling question status:', error);
      toast.error('Failed to update question status');
    }
  };

  return {
    questions,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    currentQuestion,
    setCurrentQuestion,
    isSaving,
    isDeleting,
    fetchQuestions,
    handleAddQuestion,
    handleEditQuestion,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleMoveQuestion,
    toggleQuestionActive
  };
};
