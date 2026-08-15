import { initialMockConversations } from "../src/features/candidate-messages/data/mockConversations";
import { candidateMessageService } from "../src/features/candidate-messages/services/candidateMessageService";
import {
  formatDateSeparator,
  formatMessageTime,
  formatShortDate,
  getLastMessagePreview,
} from "../src/features/candidate-messages/lib/format";

console.log("=================================================");
console.log("SPRINT 6 PHASE A: CANDIDATE MESSAGES VALIDATION");
console.log("=================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // 1. Initial Mock Data Checks
  console.log("\n--- 1. Initial Mock Conversations Data ---");
  assert(initialMockConversations.length >= 4, `Expected at least 4 conversations, found ${initialMockConversations.length}`);
  
  const unreadConvs = initialMockConversations.filter(c => c.unreadCount > 0);
  assert(unreadConvs.length >= 2, `Expected at least 2 unread conversations, found ${unreadConvs.length}`);
  
  const totalUnread = initialMockConversations.reduce((sum, c) => sum + c.unreadCount, 0);
  assert(totalUnread === 3, `Expected exactly 3 total unread messages, got ${totalUnread}`);

  assert(initialMockConversations.every(c => Boolean(c.companyName) && Boolean(c.jobTitle)), "All conversations have company name and job title");
  assert(initialMockConversations.every(c => c.messages.length > 0), "All conversations have at least one message");
  assert(initialMockConversations.every(c => Boolean(c.companyLogo)), "All conversations have company logo badge/initials");

  // 2. Service List & Sorting
  console.log("\n--- 2. Service List & Sorting ---");
  const listResult = await candidateMessageService.listConversations();
  assert(listResult.success, "listConversations succeeded");
  if (listResult.success) {
    assert(listResult.data.length === initialMockConversations.length, "Returns all mock conversations");
    
    // Check sorting: descending order of lastMessageAt
    let isSorted = true;
    for (let i = 0; i < listResult.data.length - 1; i++) {
      if (listResult.data[i].lastMessageAt < listResult.data[i + 1].lastMessageAt) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Conversations are sorted by most recent lastMessageAt first");
  }

  // 3. Search Filtering
  console.log("\n--- 3. Search Filtering ---");
  const fioriSearch = await candidateMessageService.listConversations("Fiori");
  assert(fioriSearch.success && fioriSearch.data.length === 1 && fioriSearch.data[0].companyName === "Bridgecore IT Services", "Search by job title 'Fiori' returns Bridgecore IT Services");

  const btpSearch = await candidateMessageService.listConversations("BTP");
  assert(btpSearch.success && btpSearch.data.length === 1 && btpSearch.data[0].companyName === "CloudSAP Tech Systems", "Search by SAP module 'BTP' returns CloudSAP Tech Systems");

  const msgSearch = await candidateMessageService.listConversations("calendar invite");
  assert(msgSearch.success && msgSearch.data.length === 1 && msgSearch.data[0].companyName === "Bridgecore IT Services", "Search by message content 'calendar invite' returns matching conversation");

  const emptySearch = await candidateMessageService.listConversations("NonexistentXYZCompany");
  assert(emptySearch.success && emptySearch.data.length === 0, "Non-matching search returns empty array");

  // 4. Mark Conversation as Read
  console.log("\n--- 4. Mark Conversation as Read ---");
  const bridgecoreBefore = (await candidateMessageService.getConversation("conv_bridgecore_1"));
  assert(bridgecoreBefore.success && bridgecoreBefore.data.unreadCount === 1, "Bridgecore has 1 unread message initially");

  const readResult = await candidateMessageService.markConversationRead("conv_bridgecore_1");
  assert(readResult.success && readResult.data.unreadCount === 0, "Marking Bridgecore read reduces unreadCount to 0");
  assert(readResult.success && readResult.data.messages.every(m => m.read === true), "All messages in marked conversation are set to read");

  const unreadCountResult = await candidateMessageService.getUnreadCount();
  assert(unreadCountResult.success && unreadCountResult.data === 2, `Total unread count decreases from 3 to 2 (got ${unreadCountResult.success ? unreadCountResult.data : "error"})`);

  // 5. Send Message & Conversation Reordering
  console.log("\n--- 5. Send Message & Reordering ---");
  const sendEmpty = await candidateMessageService.sendMessage("conv_bridgecore_1", "   ");
  assert(!sendEmpty.success, "Rejects empty or whitespace-only message");

  const longContent = "A".repeat(5001);
  const sendLong = await candidateMessageService.sendMessage("conv_bridgecore_1", longContent);
  assert(!sendLong.success, "Rejects message exceeding 5,000 characters limit");

  const validMessage = "Thank you! I am prepared for the discussion tomorrow at 11:00 AM IST.";
  const sendResult = await candidateMessageService.sendMessage("conv_bridgecore_1", validMessage);
  assert(sendResult.success, "Valid message sent successfully");
  if (sendResult.success) {
    const lastMsg = sendResult.data.messages[sendResult.data.messages.length - 1];
    assert(lastMsg.content === validMessage, "New message content appended to conversation");
    assert(lastMsg.sender === "candidate", "New message sender set to candidate");
    assert(lastMsg.status === "sent", "New message status set to sent");
    assert(sendResult.data.lastMessagePreview.includes("Thank you!"), "Conversation lastMessagePreview updated");

    // Check that conversation moved to top of list
    const refreshedList = await candidateMessageService.listConversations();
    if (refreshedList.success) {
      assert(refreshedList.data[0].id === "conv_bridgecore_1", "Conversation moved to top of conversation list after new message");
    }
  }

  // 6. Format Helpers
  console.log("\n--- 6. Format Helpers ---");
  const nowIso = new Date().toISOString();
  const timeFormatted = formatMessageTime(nowIso);
  assert(timeFormatted.length > 0, `formatMessageTime formatted current time: '${timeFormatted}'`);

  const separatorToday = formatDateSeparator(nowIso);
  assert(separatorToday === "Today", `formatDateSeparator for current date returned 'Today'`);

  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();
  const separatorYesterday = formatDateSeparator(yesterdayIso);
  assert(separatorYesterday === "Yesterday", `formatDateSeparator for yesterday returned 'Yesterday'`);

  const preview = getLastMessagePreview("   This is a   very long message with spaces that should be shortened nicely.   ", 30);
  assert(preview.length <= 32 && preview.endsWith("…"), `getLastMessagePreview formats preview correctly: '${preview}'`);

  // 7. Start New Conversation
  console.log("\n--- 7. Start New Conversation ---");
  const newConvResult = await candidateMessageService.startConversation({
    companyId: "comp_new_corp",
    companyName: "SAP Global Partners",
    jobId: "job_new_99",
    jobTitle: "SAP Architect",
    applicationId: "app_new_99",
    applicationStatus: "applied",
    initialMessage: "Hello, I am excited about the SAP Architect opportunity.",
  });
  assert(newConvResult.success, "startConversation created new conversation successfully");
  if (newConvResult.success) {
    assert(newConvResult.data.companyName === "SAP Global Partners", "New conversation company name matches");
    assert(newConvResult.data.messages.length === 1, "New conversation contains initial message");
    assert(newConvResult.data.messages[0].sender === "candidate", "Initial message sender is candidate");
  }

  // Summary
  console.log("\n=================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
