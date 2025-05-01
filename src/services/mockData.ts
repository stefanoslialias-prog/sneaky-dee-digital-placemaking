
// This file simulates a backend API service until we connect to a real backend

export type Sentiment = 'happy' | 'neutral' | 'concerned';

export interface SurveyResponse {
  id: string;
  timestamp: string;
  location: string;
  sentiment: Sentiment;
  comment?: string;
}

export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  totalSessions: number;
  footTraffic: number;
}

// Sample Toronto locations
const locations: LocationData[] = [
  { 
    id: '1', 
    name: 'Yonge-Dundas Square', 
    latitude: 43.6561, 
    longitude: -79.3802,
    totalSessions: 1245,
    footTraffic: 3500
  },
  { 
    id: '2', 
    name: 'Union Station', 
    latitude: 43.6453, 
    longitude: -79.3806,
    totalSessions: 2890,
    footTraffic: 5600
  },
  { 
    id: '3', 
    name: 'Bloor & Yonge', 
    latitude: 43.6709, 
    longitude: -79.3856,
    totalSessions: 1658,
    footTraffic: 4200
  },
  { 
    id: '4', 
    name: 'Queen West', 
    latitude: 43.6479, 
    longitude: -79.3976,
    totalSessions: 975,
    footTraffic: 2800
  },
  { 
    id: '5', 
    name: 'Harbourfront', 
    latitude: 43.6389, 
    longitude: -79.3768,
    totalSessions: 1340,
    footTraffic: 3100
  },
  { 
    id: '6', 
    name: '622 Bloor West', 
    latitude: 43.6654, 
    longitude: -79.4129,
    totalSessions: 755,
    footTraffic: 1800
  }
];

// Simulated survey responses
const generateMockResponses = (): SurveyResponse[] => {
  const sentiments: Sentiment[] = ['happy', 'neutral', 'concerned'];
  const responses: SurveyResponse[] = [];
  
  // Generate 200 mock responses
  for (let i = 0; i < 200; i++) {
    // Random date within the last 7 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    date.setHours(Math.floor(Math.random() * 24));
    
    // Random location
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Random sentiment with weighted distribution (more happy than concerned)
    const sentiment = sentiments[Math.floor(Math.random() * (sentiments.length + 1)) % sentiments.length];
    
    // Sometimes add a comment
    let comment;
    if (Math.random() > 0.7) {
      const comments = [
        'Love the new seating area!',
        'WiFi is too slow during peak hours',
        'More shade needed on hot days',
        'Great place to relax',
        'Needs more garbage bins',
        'Perfect spot to meet friends',
        'Could use more food options nearby',
        'Very clean and well maintained'
      ];
      comment = comments[Math.floor(Math.random() * comments.length)];
    }
    
    responses.push({
      id: `response-${i}`,
      timestamp: date.toISOString(),
      location: location.name,
      sentiment,
      comment
    });
  }
  
  // Sort by timestamp (newest first)
  return responses.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Mock data store (would be replaced by a real database)
const mockDatabase = {
  responses: generateMockResponses(),
  locations: locations,
  
  // Method to add a new survey response
  addResponse(locationId: string, sentiment: Sentiment, comment?: string): SurveyResponse {
    const location = this.locations.find(l => l.id === locationId) || this.locations[0];
    
    // Create new response
    const newResponse: SurveyResponse = {
      id: `response-${Date.now()}`,
      timestamp: new Date().toISOString(),
      location: location.name,
      sentiment,
      comment
    };
    
    // Add to our "database"
    this.responses.unshift(newResponse);
    
    // Update session count for this location
    const locationIndex = this.locations.findIndex(l => l.id === locationId);
    if (locationIndex >= 0) {
      this.locations[locationIndex].totalSessions++;
    }
    
    return newResponse;
  },
  
  // Method to get all responses
  getResponses(): SurveyResponse[] {
    return this.responses;
  },
  
  // Method to get responses by location
  getResponsesByLocation(locationId: string): SurveyResponse[] {
    const location = this.locations.find(l => l.id === locationId);
    if (!location) return [];
    
    return this.responses.filter(r => r.location === location.name);
  },
  
  // Method to get location data
  getLocations(): LocationData[] {
    return this.locations;
  },
  
  // Method to get sentiment summary for dashboard
  getSentimentSummary() {
    const total = this.responses.length;
    const happy = this.responses.filter(r => r.sentiment === 'happy').length;
    const neutral = this.responses.filter(r => r.sentiment === 'neutral').length;
    const concerned = this.responses.filter(r => r.sentiment === 'concerned').length;
    
    return {
      total,
      happy: {
        count: happy,
        percentage: Math.round((happy / total) * 100)
      },
      neutral: {
        count: neutral,
        percentage: Math.round((neutral / total) * 100)
      },
      concerned: {
        count: concerned,
        percentage: Math.round((concerned / total) * 100)
      }
    };
  }
};

export default mockDatabase;
