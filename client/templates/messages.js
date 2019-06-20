import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import {Chats,Messages} from "/collections/models";

import './messages.html';
import './one-message.html'
import '/account-config/config';
import '/lib/router';
import '../scroll-to-new-message/scrolling';

function updateTelegram() {
    var chatId=FlowRouter.getParam('id');
    if(chatId!==undefined && Chats.findOne({_id:chatId}).telegramChat!==undefined){
        var chatIdT=Chats.findOne({_id:chatId}).telegramChat;
        Meteor.call("chatHistory",chatIdT, function (err,res) {
            if (err) {
                console.log(err.reason);
            } else {
                console.log("receive message :", res);
                var messageId = res["0"].id;
                if(res["0"]._ === 'message' && Messages.findOne({messageFromTlId: messageId})===undefined){
                    var messageText = res["0"].message;
                    var fromId=res["0"].from_id;
                    var username;
                    var userTelegram=Chats.findOne({_id: chatId}).telegramParticipantsId[0].participantOne;
                    if( userTelegram === fromId){
                        username = Chats.findOne({_id: chatId}).telegramParticipantsId[0].usernameOne;
                    }else{
                        username=Chats.findOne({_id: chatId}).telegramParticipantsId[1].usernameTwo;
                    }
                    console.log("username", username);
                    if(username!== undefined && Meteor.user().username!==username){
                        Meteor.call("incomingMessageTelegram", messageText, username, chatId, messageId, function (err, res) {
                            if (err) {
                                console.log(err.reason);
                            } else {
                                console.log("insert incoming message", res);
                            }
                        })
                    }
                }


            }
        })
    }
}
if(Meteor.userId()){
    setInterval(updateTelegram, 3000);
}
var autoScrollingIsActive = false;
Meteor.subscribe("messages", {
    onReady: function () {
        scrollToBottom();
        autoScrollingIsActive = true;
    }
});
Meteor.subscribe('chats');
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
                alert(err.reason)
            }else {
                //console.log('Message inserted with ID:', res);
                scrollToBottom(250);
                event.target.text.value = " ";
                event.preventDefault();
            }
        });
        var telegramChatId=Chats.findOne({_id:chatId}).telegramChat;
        Meteor.call("sendMessageMethod", text, telegramChatId, function (err,res) {
            if(err){
                console.log(err.reason);
            }else {
                console.log("send message", res);
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
    },
    "click .addToTelegram":function () {
        var phone_number = '+380950351849';

        Meteor.call("checkPhoneMethod", phone_number, function (err,res) {
            if(err){
                console.log(err.reason);
            }else {
                console.log("Phone registered: ",res.phone_registered);
                if(res.phone_registered){
                    Meteor.call("sendCodeMethod",phone_number, function (err,res) {
                        if(err){
                            console.log(err.reason);
                        }else {
                            console.log("Phone code hash: ", res);
                            var code=prompt("Telegram code");
                            Meteor.call("signInMethod", phone_number, code, res, function (err,res) {
                                if(err){
                                    console.log(err.reason);
                                }else {
                                    console.log("Sign in as: ", res);
                                    var myId=res.id;
                                    Meteor.users.update(
                                        {_id: Meteor.userId()},
                                        {
                                            $set:{telegramId: myId}
                                        }
                                    );
                                    var userName='ivanAndriichak';
                                    Meteor.call("contactsResolveUsername", userName, function (err,res) {
                                        if(err){
                                            console.log(err.reason);
                                        }else {
                                            console.log("Contact resolve : ", res);
                                            console.log("User id telegram: ",res.peer.user_id);
                                            var chatId=FlowRouter.getParam('id');
                                            console.log("My chat id",chatId);
                                            var chatName=Chats.findOne({_id:chatId}).participants;
                                            var chatNameTelegram=chatName.join(' and ');
                                            console.log("chatName:", chatName);
                                            var accessHash=res.users["0"].access_hash;

                                            Meteor.call("createTelegramChat", res.peer.user_id, accessHash, chatNameTelegram, function (err,res) {
                                                if(err){
                                                    console.log(err.reason);
                                                }else{
                                                    console.log("create chat:", res);
                                                    var telegramChatId=res.chats["0"].id;
                                                    var participantOne=res.users["0"].id;
                                                    var participantTwo=res.users["1"].id;
                                                    var usernameOne=Chats.findOne({_id: chatId}).friendName;
                                                    var usernameTwo=Meteor.user().username;
                                                    console.log(telegramChatId);
                                                    Chats.update(
                                                        {_id: chatId},
                                                        {
                                                            $set: {
                                                                telegramChat: telegramChatId,
                                                                telegramParticipantsId: [{participantOne: participantOne, usernameOne:usernameOne}, {participantTwo: participantTwo, usernameTwo:usernameTwo}]
                                                            },
                                                        }
                                                    );
                                                    document.getElementById("telegram").firstChild.data="Created telegram chat";
                                                    document.getElementById("telegram").disabled="disabled";
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            }
        });

    }
});
