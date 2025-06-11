
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const seedSampleCoupons = async () => {
  try {
    // Check if we already have coupons
    const { data: existingCoupons, error: checkError } = await supabase
      .from('coupons')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing coupons:', checkError);
      return false;
    }

    // If we already have coupons, don't seed again
    if (existingCoupons && existingCoupons.length > 0) {
      console.log('Coupons already exist, skipping seed');
      return true;
    }

    console.log('Seeding sample coupons...');

    const sampleCoupons = [
      {
        title: "Tim Hortons Double Double",
        description: "Free medium double double coffee with any food purchase",
        code: "TIMSFREE2024",
        discount: "Free Coffee",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        active: true,
        image_url: "/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png"
      },
      {
        title: "Metro Grocery Deal",
        description: "15% off your entire grocery purchase over $50",
        code: "METRO15OFF",
        discount: "15% off",
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        active: true,
        image_url: "/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png"
      },
      {
        title: "Local Bookstore Special",
        description: "Buy 2 books, get 1 free from our bestseller collection",
        code: "BOOKS321",
        discount: "Buy 2 Get 1 Free",
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        active: true,
        image_url: "/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png"
      }
    ];

    const { data, error } = await supabase
      .from('coupons')
      .insert(sampleCoupons)
      .select();

    if (error) {
      console.error('Error seeding coupons:', error);
      toast.error('Failed to create sample coupons');
      return false;
    }

    console.log('Successfully seeded sample coupons:', data);
    toast.success('Sample coupons created successfully!');
    return true;

  } catch (error) {
    console.error('Unexpected error seeding coupons:', error);
    toast.error('Failed to create sample coupons');
    return false;
  }
};

// Function to seed sample survey questions if needed
export const seedSampleQuestions = async () => {
  try {
    // Check if we already have questions
    const { data: existingQuestions, error: checkError } = await supabase
      .from('survey_questions')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing questions:', checkError);
      return false;
    }

    // If we already have questions, don't seed again
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist, skipping seed');
      return true;
    }

    console.log('Seeding sample questions...');

    const sampleQuestions = [
      {
        text: "How do you feel about the cleanliness of this area?",
        type: "sentiment",
        category: "environment",
        order: 1,
        active: true
      },
      {
        text: "How satisfied are you with the WiFi connectivity here?",
        type: "sentiment",
        category: "technology",
        order: 2,
        active: true
      },
      {
        text: "How would you rate the safety of this location?",
        type: "sentiment",
        category: "safety",
        order: 3,
        active: true
      },
      {
        text: "How do you feel about the available amenities in this area?",
        type: "sentiment",
        category: "amenities",
        order: 4,
        active: true
      },
      {
        text: "How satisfied are you with the overall experience here?",
        type: "sentiment",
        category: "general",
        order: 5,
        active: true
      },
      {
        text: "How likely are you to recommend this place to others?",
        type: "sentiment",
        category: "recommendation",
        order: 6,
        active: true
      }
    ];

    const { data, error } = await supabase
      .from('survey_questions')
      .insert(sampleQuestions)
      .select();

    if (error) {
      console.error('Error seeding questions:', error);
      toast.error('Failed to create sample questions');
      return false;
    }

    console.log('Successfully seeded sample questions:', data);
    toast.success('Sample questions created successfully!');
    return true;

  } catch (error) {
    console.error('Unexpected error seeding questions:', error);
    toast.error('Failed to create sample questions');
    return false;
  }
};
