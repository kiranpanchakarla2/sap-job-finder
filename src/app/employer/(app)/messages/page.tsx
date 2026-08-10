import { Suspense } from "react";
import { MessagesPage } from "@/features/employer-messages";
import { ConversationSkeleton } from "@/features/employer-messages/components/MessageSkeletons";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl p-4">
          <ConversationSkeleton />
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}
