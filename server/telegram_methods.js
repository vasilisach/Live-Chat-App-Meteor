import {Meteor} from 'meteor/meteor';
import MTProto from 'telegram-mtproto';
import Storage from 'mtproto-storage-fs';
//import inputField from './fixtures';

const app = { storage: new Storage('./storage.json') };

const config = {
    "api_id": 885731,
    "api_hash": "1e28fec4c66723b954c1bf5f4119c4b9"
};

const api = {
    layer         : 57,
    initConnection: 0x69796de9,
    api_id        : config.api_id,
    app_version: '1.0.0',
    lang_code: 'en'
};

const server = {
    dev: false
};
const phone={
    num: '+380950351849'
};
const telegramClient  = MTProto({ server, api, app});

Meteor.methods({
    "logInMethod": async function login() {
        const {phone_code_hash} = await telegramClient('auth.sendCode', {
            phone_number: phone.num,
            api_id: config.api_id,
            api_hash: config.api_hash
        });
        //const code = await inputField('code');
        const {user} = await telegramClient('auth.signIn', {
            phone_number   : phone.num,
            phone_code_hash: phone_code_hash,
            phone_code     : code
        });
        console.log(phone_code_hash);
        console.log(user);
        return user;
    },
    "signInMethod": async function signIn(code, phone_code_hash){
        const {user} = await telegramClient('auth.signIn', {
            phone_number   : phone.num,
            phone_code_hash: phone_code_hash,
            phone_code     : code
        });
        console.log(JSON.stringify(user));
        return user;
    },
    "areYouLoggedIn":async function(){
        if (!(await app.storage.get('signedin'))) {
            console.log('not signed in');

            await Meteor.call('logInMethod');

            console.log('signed in successfully');
            app.storage.set('signedin', true)
        } else {
            console.log('already signed in')
        }
    },
    "sendMessageMethod": async function (messageText, userId) {

        const {send_message} = await telegramClient('messages.sendMessage', {
            peer: {
                _:'inputPeerUser',
                user_id: userId
            },
            message: messageText,
            random_id: Math.random() * 10e7 >> 0
        });
        console.log(JSON.stringify(send_message));
        return send_message;
    },
    "login": async () => {
        try {
            const phone = await inputField('phone');
            console.log(phone);
            const { phone_code_hash } = await telegramClient('auth.sendCode', {
                phone_number  : phone,
                current_number: false,
                api_id        : config.id,
                api_hash      : config.hash
            });
            const code = await inputField('code');
            const {user} = await telegramClient('auth.signIn', {
                phone_number: phone,
                phone_code_hash,
                phone_code  : code
            });

            console.log('signIn as', user);
            return user;
        } catch (error) {
            console.error(error)
        }
    }
});
