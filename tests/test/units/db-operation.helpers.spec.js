const { getUnreadMessagesPerUser } = require("../../../helpers/db-operation.helpers.js");
const { expect } = require("../../config.js");
const { gracefulQuit } = require("../../helpers/helpers.js");

describe.only("getUnreadMessagesPerUser", () => {
  after(() => {
    gracefulQuit();
  });

  it("should return number of unread messages per user", async () => {
    const userId = 1;
    const userLastCheck = {
      id: 1,
      user_id: 1,
      last_check: "2023-10-20T15:46:31Z",
      last_checks: {
        2: "2023-10-20T15:46:30Z",
      },
    };
    const messages = [
      {
        id: 1,
        from: 1,
        to: 2,
        date: "2023-10-20T15:46:30Z",
        content: "1",
      },
      {
        id: 2,
        from: 2,
        to: 1,
        date: "2023-10-20T15:55:15Z",
        content: "2",
        // unread
      },
      {
        id: 3,
        from: 2,
        to: 1,
        date: "2023-10-20T15:56:15Z",
        content: "3",
        // unread
      },
      {
        id: 4,
        from: 1,
        to: 2,
        date: "2023-10-20T15:56:15Z",
        content: "4",
      },
      {
        id: 5,
        from: 3,
        to: 1,
        date: "2023-10-20T15:56:15Z",
        content: "5",
        // unread
      },
    ];

    const expected = { allUnreadMessages: 3, unreadMessagesPerUser: { 2: 2, 3: 1 } };

    // Act:
    const result = getUnreadMessagesPerUser(messages, userLastCheck, userId);

    // Assert:
    expect(result, JSON.stringify(result)).to.eql(expected);
  });
});
