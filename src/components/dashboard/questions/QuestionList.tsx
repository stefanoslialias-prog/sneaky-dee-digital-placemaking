
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Question } from '@/hooks/useQuestionManager';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down') => Promise<void>;
  onToggleActive: (questionId: string, currentActive: boolean) => Promise<void>;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  loading,
  onAddQuestion,
  onEditQuestion,
  onMoveQuestion,
  onToggleActive
}) => {
  const questionTypes = [
    { value: 'sentiment', label: 'Sentiment (Happy/Neutral/Concerned)' },
    { value: 'text', label: 'Text Response' },
    { value: 'multiple_choice', label: 'Multiple Choice' }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(null).map((_, index) => (
          <div key={`loading-${index}`} className="border rounded-md p-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">No questions found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first survey question
        </p>
        <Button onClick={onAddQuestion} className="mt-4">
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </div>
    );
  }

  return (
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
                onClick={() => onMoveQuestion(question.id, 'up')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                disabled={index === questions.length - 1}
                onClick={() => onMoveQuestion(question.id, 'down')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onToggleActive(question.id, question.active)}
              >
                {question.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onEditQuestion(question)}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
