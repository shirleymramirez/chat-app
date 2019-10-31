const uuidv4 = require('uuid/v4');

const createUser = ({name = "", socketId = null} = {})=>({
    id:uuidv4(),
    name,
    socketId
})

const createChat = ({messages=[], name = "Community", users = [], isCommunity = false} = {}) => (
    {
        id:uuidv4(),
        name : isCommunity ? "Community" : createChatNameFromUsers(users),
        messages,
        users,
        typingUsers:[],
        isCommunity
    }
)

const createChatNameFromUsers = (users,excludedUser = "")=>{
    return (users.filter(u=>u!==excludedUser).join(' & ') || "Empty Chat");
}

const createMessage = ({message="",sender=""} = {}) =>(
    {
        id:uuidv4(),
        time:getTime(new Date(Date.now())),
        message,
        sender
    }
)

const getTime = (date) =>{
    return `${date.getHours()}:${("0"+date.getMinutes()).slice(-2)}`;
}

module.exports = {createMessage,createChat,createUser, createChatNameFromUsers};