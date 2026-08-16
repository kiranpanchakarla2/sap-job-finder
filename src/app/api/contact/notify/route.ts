/**
 * Contact Notifications Server Route Handler (Sprint 8F)
 * Dispatches confirmation, support alerts, and status update notifications server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import {
  sendContactRequestConfirmation,
  sendNewContactRequestNotification,
  sendContactRequestStatusNotification,
} from "@/services/server/contactNotificationService";
import type { ContactRequest, ContactRequestStatus } from "@/types/contact";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, contactRequest, requestId, oldStatus, newStatus, companyName } = body;

    let reqData: ContactRequest | null = contactRequest || null;

    if (!reqData && requestId) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: "Contact request not found." },
          { status: 404 }
        );
      }
      reqData = data as unknown as ContactRequest;
    }

    if (!reqData) {
      return NextResponse.json(
        { success: false, error: "Missing contact request data." },
        { status: 400 }
      );
    }

    if (type === "new_request") {
      // 1. Send confirmation to requester
      const confirmResult = await sendContactRequestConfirmation(reqData);
      // 2. Send alert to support team
      const supportResult = await sendNewContactRequestNotification(reqData, companyName);

      return NextResponse.json({
        success: true,
        confirmation: confirmResult,
        supportAlert: supportResult,
      });
    }

    if (type === "status_update") {
      if (!newStatus) {
        return NextResponse.json(
          { success: false, error: "Missing newStatus for status update." },
          { status: 400 }
        );
      }

      const statusResult = await sendContactRequestStatusNotification(
        reqData,
        newStatus as ContactRequestStatus,
        oldStatus as ContactRequestStatus | undefined
      );

      return NextResponse.json({
        success: true,
        statusNotification: statusResult,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported notification type: "${type}".` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error in notification route.";
    console.error("[API/Contact/Notify] Exception:", err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
