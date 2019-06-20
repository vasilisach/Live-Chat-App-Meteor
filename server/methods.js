import {Meteor} from 'meteor/meteor';
import {Chats, Messages} from "/collections/models";
//import {telegramClient} from "../telegramConfig"
import MTProto from 'telegram-mtproto';
import Storage from 'mtproto-storage-fs';

const app = { storage: new Storage('./storage.json') };
const api = {
    layer         : 57,
    initConnection: 0x69796de9,
    api_id        : Meteor.settings.public.api_id,
    app_version: '1.0.0',
    lang_code: 'en'
};
const phone={
    num: '+380950351849'
};
const server = {
    dev: false
};
const telegramClient  = MTProto({ server, api, app});

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
    },
    incomingMessageTelegram: function(messageText, username, chatId, messageId){
      Messages.insert({
          messageText:messageText,
          createdAt: new Date(),
          username:username,
          time: moment(new Date()).format("M/D/YY h:mm a"),
          chatId: chatId,
          messageFromTlId: messageId
      })
    },

    //telegram-mtproto methods

    "checkPhoneMethod":  async function checkPhone(phone_number) {
        return await telegramClient('auth.checkPhone', phone_number);
    },
    "checkUsernameMethod": async function(username){
        return await telegramClient('auth.checkUsername', username);
    },
    "sendCodeMethod": async function send(phone_number) {
            const {phone_code_hash} = await telegramClient('auth.sendCode', {
                phone_number: phone_number,
                api_id: Meteor.settings.public.api_id,
                api_hash: Meteor.settings.public.api_hash
            });
            return phone_code_hash;
    },
    "signInMethod": async function signIn(phone_number, code, phone_code_hash){
        const {user} = await telegramClient('auth.signIn', {
            phone_number   : phone_number,
            phone_code_hash: phone_code_hash,
            phone_code     : code
        });
        return user;
    },
    "contactsResolveUsername": async function contactSearch(userName){
        const contact=await telegramClient('contacts.resolveUsername', {
            username: userName
        });
        return contact;
    },
    "createTelegramChat": async function(usersId,accessHash, chatTitle){
        const createChat=await telegramClient('messages.createChat', {
            users: [{
                _:"inputUser",
                user_id:usersId,
                access_hash:accessHash}],//type: Vector<inputUser> list of users ID
            title: chatTitle //string
        });
        return createChat;
    },
    "addChatUserTelegram": async function(chatId, userId, fwdLimit){
        return await telegramClient('messages.addChatUser', {
            chat_id: chatId, //int
            user_id: userId, //InputUser
            fwd_limit: fwdLimit, //int
        })
    },
    "sendMessageMethod": async function (messageText, chatId) {

        const {send_message} = await telegramClient('messages.sendMessage', {
            peer: {
                _:'inputPeerChat',
                chat_id: chatId
            },
            message: messageText,
            random_id: Math.random() * 10e7 >> 0
        });
        return send_message;
    },
    "areYouLoggedIn":async function(phone_number){
        if (!(await app.storage.get('signedin'))) {
            console.log('not signed in');

            await Meteor.call("sendCodeMethod",phone_number, function (err,res) {
                if(err){
                    console.log(err.reason);
                }else {
                    console.log("Phone code hash: ", res);
                    var code=prompt("Telegram code");
                    Meteor.call("signInMethod", phone_number, code, res, function (err,res) {
                        if (err) {
                            console.log(err.reason);
                        } else {
                            console.log("Sign in as: ", res);
                        }
                    })
                }
            });

            console.log('signed in successfully');
            app.storage.set('signedin', true)
        } else {
            console.log('already signed in')
        }
    },
    "receiveMessages": async function(a){
        return await telegramClient("messages.receivedMessages",{
            max_id:5
        })
    },
    "updates": async function(){
        return await telegramClient("updates.getState");
    },
    "chatHistory": async function(chatId){
        const filterLastDay = ({ date }) => new Date(date*1e3) > dayRange();

        const dayRange = () => Date.now() - new Date(86400000*4);
        const filterUsersMessages = ({ _ }) => _ === 'message';

        const formatMessage = ({ message, date, from_id }) => {
            const dt = new Date(date*1e3);
            const hours = dt.getHours();
            const mins = dt.getMinutes();
            return `${hours}:${mins} [${from_id}] ${message}`
        };

        const printMessages = messages => {
            const filteredMsg = messages.filter(filterUsersMessages);
            const formatted = filteredMsg.map(formatMessage);
            formatted.forEach(e => console.log(e));
            return formatted
        };
        const max = 400;
        const limit = 100;
        let offset = 0;
        let full = [],
            messages = [];
        do {
            const history = await telegramClient('messages.getHistory', {
                peer: {
                    _          : 'inputPeerChat',
                    chat_id : chatId
                },
                max_id: offset,
                offset: -full.length,
                limit: limit
            });
            messages = history.messages.filter(filterLastDay);
            full = full.concat(messages);
            messages.length > 0 && (offset = messages[0].id);
            messages.length > 0 && console.log(offset, messages[0].id)
        } while (messages.length === limit && full.length < max);
        printMessages(full);
        return full
    }
});