import {Meteor} from 'meteor/meteor';
import {Chats, Messages} from "/collections/models";

Meteor.methods({
    createChat: function (searchName) {
        var search = Meteor.users.find({username: searchName});
        if (search.count() === 0) {
            Console.log("Not found contact")
        } else {
            Chats.insert({
                ownerId: this.userId,
                friendId: Meteor.users.findOne({username: searchName})._id,
                friendName: searchName,
                participants: [Meteor.user().username, searchName]
            })
        }
    },
    sendMessage: function (messageText, chat_id) {
        if (! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Messages.insert({
            messageText: messageText,
            createdAt: new Date(),
            username: Meteor.user().username,
            time: moment(new Date()).format("M/D/YY h:mm a"),
            chatId: chat_id
        });
    }
});