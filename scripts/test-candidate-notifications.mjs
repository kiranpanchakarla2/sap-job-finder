import assert from "node:assert";
import {
  INITIAL_MOCK_NOTIFICATIONS,
} from "../src/features/candidate-notifications/data/mockNotifications.ts";
import {
  formatNotificationTime,
  getNotificationDestination,
  getNotificationMeta,
  groupNotificationsByDate,
} from "../src/features/candidate-notifications/lib/notificationUtils.ts";
import {
  candidateNotificationService,
} from "../src/features/candidate-notifications/services/candidateNotificationService.ts";

console.log("=== SPRINT 6C CANDIDATE NOTIFICATIONS LOGIC & INTEGRATION TESTS ===");

async function runTests() {
  // Test 1: Initial mock notifications
  console.log("\n1. Testing Mock Notifications...");
  assert(INITIAL_MOCK_NOTIFICATIONS.length >= 10, "Should have at least 10 notifications");
  const unreadInitial = INITIAL_MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  const readInitial = INITIAL_MOCK_NOTIFICATIONS.filter((n) => n.isRead).length;
  console.log(`   ✓ Found ${INITIAL_MOCK_NOTIFICATIONS.length} mock notifications (${unreadInitial} unread, ${readInitial} read)`);
  assert(unreadInitial > 0, "Must have unread notifications");
  assert(readInitial > 0, "Must have read notifications");

  // Test 2: Notification Service
  console.log("\n2. Testing Candidate Notification Service...");
  candidateNotificationService.resetMockData();
  const notifsResult = await candidateNotificationService.getNotifications();
  assert(notifsResult.success, "getNotifications must succeed");
  assert.strictEqual(notifsResult.data.length, INITIAL_MOCK_NOTIFICATIONS.length);

  const unreadCountResult = await candidateNotificationService.getUnreadCount();
  assert(unreadCountResult.success, "getUnreadCount must succeed");
  assert.strictEqual(unreadCountResult.data, unreadInitial);
  console.log(`   ✓ Dynamic unread count returned correctly: ${unreadCountResult.data}`);

  // Test 3: Date grouping
  console.log("\n3. Testing Date Grouping...");
  const groups = groupNotificationsByDate(INITIAL_MOCK_NOTIFICATIONS);
  assert(groups.length >= 2, "Should have multiple date groups");
  const groupTitles = groups.map((g) => g.groupTitle);
  console.log(`   ✓ Formed date groups: ${groupTitles.join(", ")}`);
  assert(groupTitles.includes("Today"), "Must contain Today group");
  assert(groupTitles.includes("Yesterday"), "Must contain Yesterday group");

  // Test 4: Relative time formatting
  console.log("\n4. Testing Timestamp Formatting...");
  const now = new Date().toISOString();
  const formattedNow = formatNotificationTime(now);
  console.log(`   ✓ Just now format: '${formattedNow}'`);
  assert(formattedNow.includes("Just now") || formattedNow.includes("0m ago") || formattedNow.includes("m ago"));

  // Test 5: Destination Resolvers
  console.log("\n5. Testing Destination Resolvers...");
  const appNotif = INITIAL_MOCK_NOTIFICATIONS.find((n) => n.type === "application");
  assert(appNotif, "Application notification should exist");
  const appDest = getNotificationDestination(appNotif);
  console.log(`   ✓ Application destination: ${appDest}`);
  assert(appDest.startsWith("/candidate/applications"));

  const msgNotif = INITIAL_MOCK_NOTIFICATIONS.find((n) => n.type === "message");
  assert(msgNotif, "Message notification should exist");
  const msgDest = getNotificationDestination(msgNotif);
  console.log(`   ✓ Message destination: ${msgDest}`);
  assert(msgDest.startsWith("/candidate/messages"));

  const alertNotif = INITIAL_MOCK_NOTIFICATIONS.find((n) => n.type === "job_alert");
  assert(alertNotif, "Job alert notification should exist");
  const alertDest = getNotificationDestination(alertNotif);
  console.log(`   ✓ Job alert destination: ${alertDest}`);
  assert.strictEqual(alertDest, "/candidate/job-alerts");

  const savedNotif = INITIAL_MOCK_NOTIFICATIONS.find((n) => n.type === "saved_job");
  assert(savedNotif, "Saved job notification should exist");
  const savedDest = getNotificationDestination(savedNotif);
  console.log(`   ✓ Saved job destination: ${savedDest}`);
  assert.strictEqual(savedDest, "/candidate/saved-jobs");

  // Test 6: Mark single notification as read
  console.log("\n6. Testing Mark as Read...");
  const firstUnread = INITIAL_MOCK_NOTIFICATIONS.find((n) => !n.isRead);
  assert(firstUnread, "Should find an unread notification");
  const markReadResult = await candidateNotificationService.markAsRead(firstUnread.id);
  assert(markReadResult.success, "markAsRead should succeed");
  assert.strictEqual(markReadResult.data.isRead, true);
  assert(markReadResult.data.readAt !== null);

  const updatedUnreadCountResult = await candidateNotificationService.getUnreadCount();
  assert.strictEqual(updatedUnreadCountResult.data, unreadInitial - 1);
  console.log(`   ✓ Unread count decremented from ${unreadInitial} to ${updatedUnreadCountResult.data}`);

  // Test 7: Mark all notifications as read
  console.log("\n7. Testing Mark All as Read...");
  const markAllResult = await candidateNotificationService.markAllAsRead();
  assert(markAllResult.success, "markAllAsRead should succeed");

  const finalUnreadCountResult = await candidateNotificationService.getUnreadCount();
  assert.strictEqual(finalUnreadCountResult.data, 0, "Unread count should be 0");
  console.log(`   ✓ Final unread count is 0 after markAllAsRead`);

  // Test 8: Metadata & Categories
  console.log("\n8. Testing Notification Metadata & Categories...");
  const types = ["application", "message", "job_alert", "interview", "saved_job", "subscription", "security", "system"];
  for (const type of types) {
    const meta = getNotificationMeta(type);
    assert(meta.icon !== undefined, `Icon should exist for ${type}`);
    assert(meta.categoryLabel.length > 0, `Category label should exist for ${type}`);
    assert(meta.badgeBg.length > 0, `Badge background class should exist for ${type}`);
  }
  console.log("   ✓ All 8 notification types properly mapped to metadata, icons, and categories");

  console.log("\n============================================================");
  console.log("🎉 ALL SPRINT 6C CANDIDATE NOTIFICATIONS LOGIC TESTS PASSED!");
  console.log("============================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
