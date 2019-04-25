import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import {Messages} from "/collections/models";

import './messages.html';
import './one-message.html'
import '/account-config/config';
import '/lib/router';
import '../scroll-to-new-message/scrolling';

var autoScrollingIsActive = false;
Meteor.subscribe("messages", {
    onReady: function () {
        scrollToBottom();
        autoScrollingIsActive = true;
    }
});
Template.messages.onRendered(function () {
    if (autoScrollingIsActive) {
        scrollToBottom(250);
    }else {
        if (Meteor.user() && this.data.username !== Meteor.user().username) {
            thereAreUnreadMessages.set(true);
        }
    }
});
Template.messages.helpers({
    recentMessages: function () {
        return Messages.find({chatId:FlowRouter.getParam('id')}, {sort: {createdAt: 1}});
    },
    thereAreUnreadMessages: function () {
        return thereAreUnreadMessages.get();
    }
});
Template.messages.events({
    "submit .new-message": function (event) {

        var text = event.target.text.value;
        var chatId=FlowRouter.getParam('id');
        Meteor.call("sendMessage", text, chatId, function (err, res){
            if(err){
                console.log(err);
                alert(error.reason)
            }else {
                //console.log('Message inserted with ID:', res);
                scrollToBottom(250);
                event.target.text.value = " ";
                event.preventDefault();
            }
        });
    },
    "scroll .message-window": function () {
        var howClose = 80;  // # pixels leeway to be considered "at Bottom"
        var messageWindow = $(".message-window");
        var scrollHeight = messageWindow.prop("scrollHeight");
        var scrollBottom = messageWindow.prop("scrollTop") + messageWindow.height();
        var atBottom = scrollBottom > (scrollHeight - howClose);
        autoScrollingIsActive = atBottom;
        if (atBottom) {
            thereAreUnreadMessages.set(false);
        }
    },
    "click .more-messages": function () {
        scrollToBottom(500);
        thereAreUnreadMessages.set(false);
    }
});
