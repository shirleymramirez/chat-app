import React, {Component} from 'react';
import SideBar from '../sidebar/SideBar';
import {NEW_CHAT_USER, COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECEIVED, TYPING, PRIVATE_MESSAGE, USER_CONNECTED, USER_DISCONNECTED} from '../../events';
import ChatHeading from './ChatHeading';
import Messages from '../messages/Messages';
import MessageInput from '../messages/MessageInput';
import {difference, values, differenceBy} from 'lodash';


class ChatContainer extends Component {
    constructor(props){
        super(props);
        this.state = {
            chats:[],
            activeChat:null,
            users:[]
        };
    }

    setActiveChat = (activeChat) => {
        this.setState({activeChat});
    }

    componentDidMount(){
        const {socket} = this.props;
        this.initSocket(socket);
        
    }

    componentWillUnmount(){
        const {socket} = this.props;
        socket.off(PRIVATE_MESSAGE);
        socket.off(USER_DISCONNECTED);
        socket.off(NEW_CHAT_USER);
    }

    initSocket = (socket) =>{
        socket.emit(COMMUNITY_CHAT, this.resetChat);
        socket.on(PRIVATE_MESSAGE,this.addChat);
        socket.on('connect',()=>{
            socket.emit(COMMUNITY_CHAT,this.resetChat);
        });
        socket.on(USER_CONNECTED, (users)=>{
            this.setState({users:values(users)});
        });
        socket.on(USER_DISCONNECTED, (users)=>{
            const removedUsers = differenceBy(this.state.users,values(users), 'id');
            this.removeUsersFromChat(removedUsers);
            this.setState({users:values(users)});
        });
        socket.on(NEW_CHAT_USER, this.addUserToChat);
    }

    sendOpenPrivateMessage = (receiver) => {
        const {socket, user} = this.props;
        const {activeChat} = this.state;
        socket.emit(PRIVATE_MESSAGE, {receiver,sender:user.name, activeChat});
    }

    resetChat = (chat) => {
        return this.addChat(chat, true);
    }

    addChat = (chat,reset = false) => {
        const {socket} = this.props;
        const {chats} = this.state;

        const newChats = reset ? [chat]:[...chats,chat];
        this.setState({chats:newChats, activeChat:reset ? chat: this.state.activeChat});

        const messageEvent = `${MESSAGE_RECEIVED}-${chat.id}`;
        const typingEvent = `${TYPING}-${chat.id}`;

        socket.on(typingEvent, this.updateTypingInChat(chat.id));
        socket.on(messageEvent, this.addMessageToChat(chat.id));
    }

    addUserToChat = ({chatId, newUser}) =>{
        const {chats} = this.state;
        const newChats = chats.map(chat=>{
            if(chat.id === chatId){
                return Object.assign({}, chat, {users:[...chat.users,newUser]});
            }
            return chat;
        });
        this.setState({chats:newChats});
    }

    removeUserFromChat = (removedUsers) => {
        const {chats} = this.state;
        const newChats = chats.map(chat =>{
            let newUsers = difference(chat.users, removedUsers.map(u=>u.name));
            return Object.assign({},chat,{users:newUsers});
        });
        this.setState({chats:newChats});
    }

    addMessageToChat = (chatId) => {
        return message => {
            const {chats} = this.state;
            let newChats = chats.map((chat)=>{
                if(chat.id === chatId)
                    chat.messages.push(message);
                return chat;
            });
            this.setState({chats:newChats});
        }
    }

    updateTypingInChat = (chatId) => {
        return (({isTyping,user})=>{
            if(user !== this.props.user.name){
                const {chats} = this.state;
                let newChats = chats.map((chat)=>{
                    if(chat.id === chatId){
                        if(isTyping && !chat.typingUsers.includes(user)){
                            chat.typingUsers.push(user);
                        }else if(!isTyping && chat.typingUsers.includes(user)){
                            chat.typingUsers = chat.typingUsers.filter(u=>u!== user);
                        }
                    }
                    return chat;
                })
                this.setState({chats:newChats});
            }
        });
    }

    sendMessage = (chatId,message) => {
        const {socket}=this.props;
        socket.emit(MESSAGE_SENT, {chatId,message});
    }

    sendTyping = (chatId,isTyping) => {
        const {socket} = this.props;
        socket.emit(TYPING, {chatId, isTyping});
    }

    render(){
        const {user, logout} = this.props;
        const {chats, activeChat, users} = this.state;
        return (
            <div className="container">
                <SideBar
                    logout={logout}
                    chats = {chats}
                    user = {user}
                    users = {users}
                    activeChat = {activeChat}
                    setActiveChat = {this.setActiveChat}
                    onSendPrivateMessage={this.sendOpenPrivateMessage}
                    />
                <div className="chat-room-container">
                    {
                        activeChat !== null ? (
                            <div className="chat-room">
                                <ChatHeading name={activeChat.name}/>
                                <Messages 
                                    messages={activeChat.messages}
                                    user={user}
                                    typingUsers={activeChat.typingUsers}/>
                                <MessageInput 
                                    sendMessage={
                                        (message)=>{
                                            this.sendMessage(activeChat.id, message);
                                        }
                                    }
                                    sendTyping={
                                        (isTyping)=>{
                                            this.sendTyping(activeChat.id,isTyping);
                                        }
                                    }
                                    />
                            </div>
                        ) : <div className="chat-room choose"><h3>Choose a chat!</h3></div>
                    }
                </div>
            </div>
        );
    }
}


export default ChatContainer;