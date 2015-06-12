/// <reference path="../node/node.d.ts" />
/// <reference path="../gridfs-stream/gridfs-stream.d.ts" />
/// <reference path="../bluebird/bluebird.d.ts" />

declare function PrettyError(error:Error, message:string, callback?:Function):void;

declare var sails:{
    hooks: {
        gfs:g.Grid;
    };
};

/*
Services
 */
declare class PaymentService  {
	static accountBalancePayment(amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object):Promise<any>;
	static creditCardPayment(amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object):Promise<any>;
	static paypalPayment(amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object):Promise<any>;
}

/*
Waterline ORM models
 */

declare class Model {
    // Basic methods
    static findOne(id:string):Promise<Model>;
    static findOne(criteria:Object):Promise<Model>;

    static find(id:string):Promise<Array<Model>>;
    static find(criteria:Object):Promise<Array<Model>>;

    static create(criteria:Object):Promise<Model>;

    static update(id:string, updateCriteria:Object):Promise<void>;
    static update(criteria:Object, updateCriteria:Object):Promise<void>;

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

	// Instance variables
	id: String;
	createdAt: Date;
	updatedAt: Date;

    // Instance methods
    save():Promise<void>;

    destroy():Promise<void>;

    toObject():Object;

    toJSON():JSON;

	populate:Promise<Model>;
}

declare class Addon extends Model {
    name:string;
    price:number;
    discount:number;
    gamemode:Addon.Gamemode;
    type:Addon.Type;
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
    status:Addon.Status;
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
	coupons:Array<Object>;

    canDownload(user:User):boolean;
    canModify(user:User):boolean;
    prettyStatus():string;
    prettyGamemode():string;
    prettyType():string;
    prettyTags():string;
    incrementTags(callback:Function):void;
    decrementTags(callback:Function):void;
	addCoupon(code:String, amount:Number, type:Number):Promise<void>;
	couponExists(code:String):boolean;
	isValidCoupon(code:String):boolean;
	incrementCoupon(code:String):Promise<void>;
	decrementCoupon(code:String):Promise<void>;
	deactivateCoupon(code:String):Promise<void>;
	getCoupon(code:String):Coupon;
}

declare class Job extends Model {
    title:string;
    description:string;
    budget:number;
    timeFrame:number;
    inProgress:boolean;
    poster:User;
    worker:User;
}

declare class Notification extends Model {
    receiver:User;
    priority:NotificationPriority;
    message:string;
}

declare class Review extends Model {
    body:string;
    author:User;
    addon:User;
    children:Array<ReviewComment>;
}

declare class ReviewComment extends Model {
    body:string;
    author:User;
    parent:Review;
}

declare class Tag extends Model {
    name:string;
    totalAddons:number;
    addons:Array<Addon>;
}

declare class Ticket extends Model {
	static findOne(id:string):Promise<Ticket>;
	static findOne(criteria:Object):Promise<Ticket>;

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

declare class TicketResponse extends Model {
    user:User;
    content:string;
    ticket:Ticket;
}

declare class Transaction extends Model {
	totalAmount:number;
	developerFee:number;
	paymentMethodFee:number;
	netAmount:number;
	paymentMethod:Transaction.PaymentMethod;
	type:Transaction.Type;
	status:Transaction.Status;
	statusReason:string;
	sender:User;
	receiver:User;
	addon:Addon;
	senderCopy:boolean;
	related:Array<Transaction>;
	description:string;
	metadata:Object;

	prettyPaymentMethod():string;
	prettyStatus():string;
	prettyType():string;
}

declare class User extends Model {
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
    transactions:Array<Transaction>;

    isModerator():boolean;

    isAdministrator():boolean;
}

declare class Coupon {
	code:string;
	amount:number;
	type:Coupon.Type;
	uses:number;
	expired:boolean;
	prettyType:string;
}

declare class Report extends Model {
	report:User;
	reported:string;
	reason:string;
	body:string;
	type:Report.Type;
	status:Report.Status;
	responses:Array<ReportResponse>;

	prettyType():string;
	prettyStatus():string;
	addResponse(user:User, body:string):Promise<void>;
}

declare class ReportResponse {
	user:string;
	body:string;
	date:Date;
}

declare class Conversation extends Model {
	participants:Array<User>;
	title:string;
	messages:Array<ConversationMessage>;

	addMessage(user:User, body:string):Promise<void>;
}

declare class ConversationMessage {
	user:string;
	body:string;
	date:Date;
}

/*
Enumerations
*/
declare module Addon {
	export enum Status {
		PENDING = 0,
		APPROVED = 1,
		DENIED = 2,
		LOCKED = 3,
		PUBLISHED = 4
	}

	export enum Gamemode {
		SANDBOX_BASED = 0,
		DARK_RP = 1,
		TTT = 2,
		MURDER = 3,
		OTHER = 4
	}

	export enum Type {
		WEAPON = 0,
		CHATBOX = 1,
		UTILITY = 2,
		OTHER = 3
	}
}

declare module Coupon {
	export enum Type {
		PERCENTAGE = 0,
		FIXED = 1
	}
}

declare module Transaction {
	export enum PaymentMethod {
		ACCOUNT_BALANCE = 0,
		CREDIT_CARD = 1,
		PAYPAL = 2
	}

	export enum Type {
		PURCHASE = 0,
		WITHDRAWAL = 1,
		DONATION = 2
	}

	export enum Status {
		PENDING = 0,
		COMPLETED = 1,
		FAILED = 2
	}

	export enum FailReason {
		INSUFFICIENT_FUNDS = 0,
		GENERAL_ERROR = 1,
		CARD_DECLINED = 2
	}
}

declare module User {
	export enum Status {
		ACTIVE = 0,
		SUSPENDED = 1,
		BANNED = 2
	}
}

declare module Report {
	export enum Type {
		USER = 0,
		ADDON = 1
	}

	export enum Status {
		FILED = 0,
		IN_PROGRESS = 1,
		CLOSED = 2
	}
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

/*
Services
 */

declare class FeeService {
	static chargeFee(user:User):void;
}

declare class NotificationService {
	static sendGlobalNotification(priority:String, message:String):void;
	static sendUserNotification(user:User, priority:String, message:String):void;
}

declare class SlackService {
	static inviteUserToSlack(user:User):void;
}