import { Review } from '@/types';


// Fetch all reviews
export const fetchReviews = async (): Promise<Review[]> => {
  const response = await fetch('/api/reviews');
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
};

// Fetch reviews by targetEmployee ID
export const fetchReviewsByEmployeeId = async (employeeId: string): Promise<Review[]> => {
  const response = await fetch(`/api/reviews?targetEmployee=${employeeId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch employee reviews');
  }
  return response.json();
};

// Fetch reviews by reviewedBy ID
export const fetchReviewsByReviewerId = async (reviewerId: string): Promise<Review[]> => {
  const response = await fetch(`/api/reviews?reviewedBy=${reviewerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviewer reviews');
  }
  return response.json();
};

// Fetch a review by ID
export const fetchReviewById = async (id: string): Promise<Review> => {
  const response = await fetch(`/api/reviews/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch review');
  }
  return response.json();
};

// Fetch reviews given by current user for a specific employee
export const fetchEmployeeReviewByCurrentUser = async (employeeId: string): Promise<{
  reviews: {
    id: string;
    content: string;
    timestamp: string;
  }[];
  hasReviewed: boolean;
}> => {
  // Add cache busting parameter to prevent browser caching
  const timestamp = new Date().getTime();
  const response = await fetch(`/api/employees/${employeeId}/reviews?_=${timestamp}`);
  if (!response.ok) {
    throw new Error('Failed to fetch employee reviews by current user');
  }
  return response.json();
};

// Fetch all reviews written by the current user
export const fetchMyReviews = async (searchQuery?: string): Promise<any> => {
  const queryParams = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
  const response = await fetch(`/api/reviews/my${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch my reviews');
  }
  return response.json();
};

// Create a new review
export const createReview = async (review: Omit<Review, '_id'>): Promise<Review> => {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });
  if (!response.ok) {
    throw new Error('Failed to create review');
  }
  return response.json();
};

// Update a review
export const updateReview = async (id: string, review: Partial<Review>): Promise<Review> => {
  const response = await fetch(`/api/reviews/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });
  if (!response.ok) {
    throw new Error('Failed to update review');
  }
  return response.json();
};

// Delete a review
export const deleteReview = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`/api/reviews/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete review');
  }
  return response.json();
}; 