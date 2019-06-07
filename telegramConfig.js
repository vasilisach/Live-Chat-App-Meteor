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

const server = {
    dev: false
};
const telegramClient  = MTProto({ server, api, app});

export default telegramClient;