
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Plus, Save, X, ArrowUp, ArrowDown, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  text: string;
  type: string;
  order: number;
  active: boolean;
}

const QuestionDesigner: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const questionTypes = [
    { value: 'sentiment', label: 'Sentiment (Happy/Neutral/Concerned)' },
    { value: 'text', label: 'Text Response' },
    { value: 'multiple_choice', label: 'Multiple Choice' }
  ];
  
  useEffect(() => {
    fetchQuestions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:survey_questions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'survey_questions' },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
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
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Survey Questions</CardTitle>
            <CardDescription>
              Design and manage the questions shown to community members
            </CardDescription>
          </div>
          <Button onClick={handleAddQuestion}>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array(3).fill(null).map((_, index) => (
                <div key={`loading-${index}`} className="border rounded-md p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No questions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first survey question
              </p>
              <Button onClick={handleAddQuestion} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className={`border rounded-md p-4 ${question.active ? '' : 'bg-gray-50 opacity-70'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{question.text}</h3>
                      <p className="text-sm text-gray-500">
                        {questionTypes.find(t => t.value === question.type)?.label || question.type} · Order: {question.order}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost" 
                        size="sm"
                        disabled={index === 0}
                        onClick={() => handleMoveQuestion(question.id, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={index === questions.length - 1}
                        onClick={() => handleMoveQuestion(question.id, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleQuestionActive(question.id, question.active)}
                      >
                        {question.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Question Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
          </div>
          
          <DialogFooter className="flex justify-between">
            <div>
              {currentQuestion?.id && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteQuestion}
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
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving || isDeleting}
              >
                Cancel
                <X className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSaveQuestion}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? 'Saving...' : 'Save'}
                {!isSaving && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuestionDesigner;
