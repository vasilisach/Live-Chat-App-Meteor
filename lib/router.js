
FlowRouter.route('/',{
    name: 'chatsList',
    action(){
        BlazeLayout.render('chatsList');
    }
});
FlowRouter.route('/chat/:id',{
    name: 'messages',
    waitOn: Meteor.subscribe('messages'),
    action(){
        BlazeLayout.render('messages');
    }
});
