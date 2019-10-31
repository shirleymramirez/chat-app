import React, {Component} from 'react';
import io from 'socket.io-client';
import {USER_CONNECTED, LOGOUT, VERIFY_USER} from '../events';
import LoginForm from './LoginForm';
import ChatContainer from './chats/ChatContainer';

const socketUrl = "/";

class Layout extends Component {

    constructor(props){
        super(props);
        this.state = {
            socket:null,
            user:null
        };
    }

    componentWillMount(){
        this.initSocket();
    }

    initSocket(){
        const socket = io(socketUrl);
        socket.on('connect', ()=>{
            if(this.state.user){
                this.reconnect(socket);
            }else{
                console.log("Connected");
            }
        });
        socket.on('connect_failed',()=>{
            console.log('Connection Failed');
        });

        this.setState({socket});
    }

    reconnect = (socket) => {
        socket.emit(VERIFY_USER, this.state.user.name, ({isUser, user})=>{
            if(isUser){
                this.setState({user:null});
            }else{
                this.setUser(user);
            }
        });
    }

    setUser = (user) => {
        const {socket} = this.state;
        socket.emit(USER_CONNECTED, user);
        this.setState({user});
    }

    logout = () =>{
        const {socket} = this.state;
        socket.emit(LOGOUT);
        this.setState({user:null});
    }

    render() {
        const {socket, user} = this.state;
        return (
            <div className="container">
            {
                !user ?
                <LoginForm socket={socket} setUser={this.setUser}/>
                :
                <ChatContainer socket={socket} user={user} logout={this.logout} />
            }
            </div>
        );
    }
}

export default Layout;