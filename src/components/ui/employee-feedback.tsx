"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview, useEmployeeReviewByCurrentUser } from "@/hooks";
import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UseQueryOptions } from "@tanstack/react-query";

interface EmployeeFeedbackProps {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeDepartment?: string;
  currentUserId?: string;
}

export function EmployeeFeedback({
  employeeId,
  employeeName,
  employeeRole,
  employeeDepartment,
  currentUserId
}: Readonly<EmployeeFeedbackProps>) {
  const [newReview, setNewReview] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch reviews given by current user for this employee
  const {
    data: employeeReview,
    isLoading,
    isError,
    refetch
  } = useEmployeeReviewByCurrentUser(
    employeeId,
    currentUserId,
    {
      enabled: !!employeeId
    } as UseQueryOptions<{
      reviews: {
        id: string;
        content: string;
        timestamp: string;
      }[];
      hasReviewed: boolean;
    }>
  );

  // Create review mutation
  const { mutate: submitReview, isPending: isSubmitting } = useCreateReview({
    onSuccess: () => {
      refetch();
      setNewReview(""); // Clear the input after successful submission
    }
  });

  // Force refetch when current user changes
  useEffect(() => {
    if (employeeId && currentUserId) {
      refetch();
    }
  }, [currentUserId, employeeId, refetch]);

  const hasReviewed = employeeReview?.hasReviewed ?? false;
  const reviews = employeeReview?.reviews ?? [];

  const handleSubmitReview = () => {
    if (!newReview.trim() || isSubmitting) return;

    // Create a new review
    submitReview({
      content: newReview,
      timestamp: new Date(),
      targetEmployee: employeeId,
      reviewedBy: currentUserId
    });
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full w-full max-h-full overflow-hidden">
      {/* Employee Header - Fixed at top */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://avatar.vercel.sh/${employeeId}`} />
            <AvatarFallback>{employeeName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{employeeName}</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">{employeeRole}</p>
              {employeeDepartment && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-500">{employeeDepartment}</p>
                </>
              )}
            </div>
          </div>
          <Badge className={hasReviewed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Badge>
        </div>
      </div>

      {/* Reviews Content - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading reviews</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't reviewed this employee yet</p>
                <p className="text-sm text-gray-400 mt-2">Provide your feedback below</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm mb-2">{review.content}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {formatDate(review.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex flex-col gap-2 border-t bg-white p-4">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Textarea
              id="review"
              placeholder="Write your feedback here..."
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              className="min-h-[80px] max-h-[120px] resize-none"
              disabled={isSubmitting}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReview();
                }
              }}
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleSubmitReview}
            disabled={isSubmitting || !newReview.trim()}
          >
            {isSubmitting ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}