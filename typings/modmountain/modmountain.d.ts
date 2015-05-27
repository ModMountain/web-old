/// <reference path="../node/node.d.ts" />
/// <reference path="../gridfs-stream/gridfs-stream.d.ts" />
/// <reference path="../bluebird/bluebird.d.ts" />

declare
function PrettyError(error:Error, message:string, callback?:Function):void;

import gridFS = require('gridfs-stream');

declare
var sails:{
    hooks: {
        gfs:gridFS.Grid
    };
};

/*
Waterline ORM models
 */

declare
class Model {
    // Basic methods
    static findOne(id:string):Promise<Model>;
    static findOne(criteria:Object):Promise<Model>;

    static find(id:string):Promise<Array<Model>>;
    static find(criteria:Object):Promise<Array<Model>>;

    static create(criteria:Object):Promise<Model>;

    static update(id:string, updateCriteria:Object):Model;
    static update(criteria:Object, updateCriteria:Object):Model;

    static destroy(id:string);
    static destroy(criteria:Object);

    static count(criteria:Object):number;

    // Helper methods
    static createEach();

    static findOrCreate(findCriteria:Object, createCriteria?:Object):Promise<Model>;

    static findOneLike();

    static startsWith();

    static endsWith();

    static contains();

    // Instance methods
    save():Promise<void>;

    destroy():Promise<void>;

    toObject():Object;

    toJSON():JSON;
}

declare
class Addon extends Model {
    name:string;
    price:number;
    discount:number;
    gamemode:AddonGamemode;
    type:AddonType;
    zipFile:string;
    size:number;
    shortDescription:string;
    description:string;
    explanation:string;
    reasonForUpdate:string;
    outsideServers:boolean;
    containsDrm:boolean;
    youtubeLink:string;
    autoUpdaterEnabled:boolean;
    configuratorEnabled:boolean;
    leakProtectionEnabled:boolean;
    statTrackerEnabled:boolean;
    status:AddonStatus;
    views:number;
    downloads:number;
    featured:boolean;
    rawTags:string;
    galleryImages:Array<string>;
    thinCardImage:string;
    wideCardImage:string;
    bannerImage:string;
    author:User;
    purchasers:Array<User>;
    transactions:Array<Transaction>;
    dependencies:Array<Addon>;
    dependents:Array<Addon>;
    reviews:Array<Review>;
    tags:Array<Tag>;

    canDownload(user:User):boolean;
    canModify(user:User):boolean;
    prettyStatus():string;
    prettyGamemode():string;
    prettyType():string;
    prettyTags():string;
    incrementTags(callback:Function):void;
    decrementTags(callback:Function):void;
}

declare
class Job extends Model {
    title:string;
    description:string;
    budget:number;
    timeFrame:number;
    inProgress:boolean;
    poster:User;
    worker:User;
}

declare
class Notification extends Model {
    receiver:User;
    priority:NotificationPriority;
    message:string;
}

declare
class Review extends Model {
    body:string;
    author:User;
    addon:User;
    children:Array<ReviewComment>;
}

declare
class ReviewComment extends Model {
    body:string;
    author:User;
    parent:Review;
}

declare
class Tag extends Model {
    name:string;
    totalAddons:number;
    addons:Array<Addon>;
}

declare
class Ticket extends Model {
    title:string;
    priority:TicketPriority;
    status:TicketStatus;
    submitter:User;
    responses:Array<TicketResponse>;
    handler:User;
    affectedAddon:Addon;

    canClose(user:User):boolean;

    canResponse(user:User):boolean;

    addResponse(user:User, content:string):Promise<void>;

    prettyStatus():string;
}

declare
class TicketResponse extends Model {
    user:User;
    content:string;
    ticket:Ticket;
}

declare
class Transaction extends Model {
    sender:User;
    receiver:User;
    senderType:TransactionType;
    receiverType:TransactionType;
    rawData:Object;
    addon:Addon;

    prettySenderType:string;
    prettyReceiverType:string;
}

declare
class User extends Model {
    username:string;
    email:string;
    steamIdentifier:string;
    steamProfile:Object;
    banned:boolean;
    permissionLevel:number;
    paypalEmail:string;
    balance:number;
    addons:Array<Addon>;
    purchases:Array<Addon>;
    postedJobs:Array<Job>;
    workJobs:Array<Job>;
    reviews:Array<Review>;
    reviewComments:Array<ReviewComment>;
    sentTickets:Array<Ticket>;
    receivedTickets:Array<Ticket>;
    sentTransactions:Array<Transaction>;
    receivedTransactions:Array<Transaction>;

    isModerator():boolean;

    isAdministrator():boolean;
}

/*
Enumerations
*/

declare enum AddonGamemode {
    SANDBOX_BASED, DARK_RP, TTT, MURDER, OTHER
}

declare enum AddonStatus {
    PENDING, APPROVED, DENIED, LOCKED, PUBLISHED
}

declare enum AddonType {
    WEAPON, CHATBOX, UTILITY, OTHER
}

declare enum NotificationPriority {
    LOW, MEDIUM, HIGH, EMERGENCY
}

declare enum TicketPriority {
    LOW, HIGH, EMERGENCY
}

declare enum TicketStatus {
    SUBMITTER_RESPONSE, HANDLER_RESPONSE, CLOSED
}

declare enum TransactionType {
    DONATION, PURCHASE, INCOME, SALE
}