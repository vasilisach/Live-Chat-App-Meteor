import { Template } from 'meteor/templating';
import {Meteor} from "meteor/meteor";
import {Chats, Messages} from "/collections/models";

import './chatsList.html';
import './chatItem.html';
import '/account-config/config';
import '/lib/router';

Meteor.subscribe("chats");
Template.chatsList.helpers({
    chatsListCount: function(){
        return Chats.find({participants: Meteor.user().username}).count();
    },
    chatsList: function () {
        return Chats.find({participants: Meteor.user().username});
    }
});
Template.chatsList.events({
    "submit .search": function (event) {
        event.preventDefault();
        var text = event.target.search.value;
        if(Chats.find({friendName:text}).count()>0){
            console.log('You have the chat');
            event.target.search.value = " ";
        }else{
            Meteor.call("createChat", text, function (err, res){
                if(err){
                    console.log(err);
                    alert(error.reason)
                }else {
                    console.log('Successful created chat',res);
                    event.target.search.value = " ";
                }
            });
        }

    },
    "click .addToTelegram": function () {

    }
});