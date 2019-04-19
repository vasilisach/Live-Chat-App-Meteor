import {Mongo} from "meteor/mongo";

export const Messages = new Mongo.Collection("messages");
export const Chats=new Mongo.Collection("chats");