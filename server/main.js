import { Meteor } from 'meteor/meteor';
import {Chats, Messages} from "/collections/models";

import './methods';

Meteor.startup(() => {
    Meteor.publish("chats", function () {
        return Chats.find();
    });
    Meteor.publish("messages", function () {
            return Messages.find();
    });
});
