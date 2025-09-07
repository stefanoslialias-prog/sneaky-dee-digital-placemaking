
import { supabase } from '@/integrations/supabase/client';

export const seedSampleCoupons = async () => {
  try {
    // Check if coupons already exist using public view
    const { data: existingCoupons, error: fetchError } = await supabase
      .from('coupons_public')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.error('Error checking existing coupons:', fetchError);
      return;
    }

    // If coupons already exist, don't seed
    if (existingCoupons && existingCoupons.length > 0) {
      console.log('Coupons already exist, skipping seeding');
      return;
    }

    // Sample coupons data
    const sampleCoupons = [
      {
        title: "Tim Hortons Coffee",
        description: "Get a free medium coffee with any breakfast sandwich purchase",
        code: "TIMFREE2024",
        discount: "Free medium coffee",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        active: true,
        image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop"
      },
      {
        title: "Metro Grocery Savings",
        description: "Save 15% on your next grocery purchase of $50 or more",
        code: "METRO15OFF",
        discount: "15% off $50+",
        expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        active: true,
        image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop"
      },
      {
        title: "Campus Bookstore Deal",
        description: "20% off all textbooks and school supplies",
        code: "BOOKS20",
        discount: "20% off textbooks",
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        active: true,
        image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop"
      }
    ];

    // Insert sample coupons
    const { error: insertError } = await supabase
      .from('coupons')
      .insert(sampleCoupons);

    if (insertError) {
      console.error('Error seeding coupons:', insertError);
    } else {
      console.log('Sample coupons seeded successfully');
    }
  } catch (error) {
    console.error('Error in seedSampleCoupons:', error);
  }
};

export const seedSampleQuestions = async () => {
  try {
    // Check if questions already exist
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('survey_questions')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.error('Error checking existing questions:', fetchError);
      return;
    }

    // If questions already exist, don't seed
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist, skipping seeding');
      return;
    }

    // Sample questions data
    const sampleQuestions = [
      {
        text: "How do you feel about the shopping experience in this mall?",
        type: "sentiment",
        category: "shopping",
        order: 1,
        active: true
      },
      {
        text: "How satisfied are you with the cleanliness of this area?",
        type: "sentiment", 
        category: "cleanliness",
        order: 2,
        active: true
      },
      {
        text: "How would you rate the accessibility of this location?",
        type: "sentiment",
        category: "accessibility", 
        order: 3,
        active: true
      },
      {
        text: "How do you feel about the variety of stores available?",
        type: "sentiment",
        category: "variety",
        order: 4,
        active: true
      },
      {
        text: "How satisfied are you with the parking situation?",
        type: "sentiment",
        category: "parking",
        order: 5,
        active: true
      },
      {
        text: "How do you feel about the overall atmosphere of this place?",
        type: "sentiment",
        category: "atmosphere",
        order: 6,
        active: true
      }
    ];

    // Insert sample questions
    const { error: insertError } = await supabase
      .from('survey_questions')
      .insert(sampleQuestions);

    if (insertError) {
      console.error('Error seeding questions:', insertError);
    } else {
      console.log('Sample questions seeded successfully');
    }
  } catch (error) {
    console.error('Error in seedSampleQuestions:', error);
  }
};
