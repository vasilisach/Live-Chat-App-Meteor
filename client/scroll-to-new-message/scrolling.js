var autoScrollingIsActive = false;
thereAreUnreadMessages = new ReactiveVar(false);
scrollToBottom = function scrollToBottom (duration) {
    var messageWindow = $(".message-window");
    var scrollHeight = messageWindow.prop("scrollHeight");
    messageWindow.stop().animate({scrollTop: scrollHeight}, duration || 0);
};