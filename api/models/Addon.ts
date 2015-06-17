/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

/**
 * Provides the database model for Addons.
 */
var AddonModel = {
	schema: true,
	attributes: {
		// The formal name of the addon. This will show up in notifications and transactions.
		name: {
			type: 'string',
			required: true
		},
		// A price of 0.0 implies that the addon is free.
		price: {
			type: 'number',
			required: true,
			min: 0,
			max: 25000
		},
		// How much the addon is discounted. This is a percentage from 1% to 99%.
		discount: {
			type: 'float',
			defaultsTo: 0.0,
			max: 0.99,
			min: 0.0
		},
		gamemode: {
			type: 'number',
			defaultsTo: Addon.Gamemode.OTHER
		},
		type: {
			type: 'number',
			defaultsTo: Addon.Type.OTHER
		},
		// Contains the ObjectID of the addon's zip file record in GridFS
		zipFile: {
			type: 'string',
			required: true
		},
		// The file size of the addon in bytes. Populated by Multer (see config/http.ts) when the addon is created.
		size: {
			type: 'number',
			required: true
		},
		// One to two sentences quickly describing the addon.
		shortDescription: {
			type: 'string',
			required: true
		},
		// The full description for the addon in Markdown format.
		description: {
			type: 'text',
			required: true
		},
		// The addon described in a few sentences. This is only seen by staff and is used during the approval process.
		explanation: {
			type: 'text',
			required: true
		},
		// When the addon is updated by the author, this field will be populated. It tells staff why it was updated.
		reasonForUpdate: {
			type: 'string'
		},
		// Whether or not the addon makes calls to outside servers. Shown to users to keep them informed.
		outsideServers: {
			type: 'boolean',
			required: true
		},
		// Whether or not the addon contains DRM or any sort of tracker. Shown to users to keep them informed.
		containsDrm: {
			type: 'boolean',
			required: true
		},
		// A link to Youtube video showcasing the addon. The video will be embedded on the addon's store page.
		youtubeLink: {
			type: 'string',
		},
		// Whether or not Mod Mountain should automatically update this addon, if possible.
		autoUpdaterEnabled: {
			type: 'boolean',
			defaultsTo: false
		},
		// Whether or not the Mod Mountain configurator is enabled for this addon.
		configuratorEnabled: {
			type: 'boolean',
			defaultsTo: false
		},
		// Whether or not Mod Mountain leak protection (unique obfuscation) is enabled for this addon.
		leakProtectionEnabled: {
			type: 'boolean',
			defaultsTo: false
		},
		// Whether or not the Mod Mountain stat tracking is enabled for this addon.
		statTrackerEnabled: {
			type: 'boolean',
			defaultsTo: false
		},
		// The status of this addon. Prettified using prettyStatus().
		status: {
			type: 'number',
			defaultsTo: Addon.Status.PENDING
		},
		// How many pageviews this addon has received
		views: {
			type: 'string',
			defaultsTo: 0,
			min: 0
		},
		// How many times this addon has been downloaded
		downloads: {
			type: 'string',
			defaultsTo: 0,
			min: 0
		},
		// Whether or not this addon is featured on the home page
		featured: {
			type: 'boolean',
			defaultsTo: false
		},
		// The addon's tags in raw (comma separated) format
		rawTags: {
			type: 'string',
		},
		// The images shown on the addon's store page, stored as an array of GridFS ObjectIDs
		galleryImages: {
			type: 'array',
			defaultsTo: []
		},
		// The image shown on the addons page, stored as a GridFS ObjectID
		cardImage: {
			type: 'string',
			required: true
		},
		// The image shown on the home page slider, stored as a GridFS ObjectID
		bannerImage: {
			type: 'string'
		},
		// The user that created this addon
		author: {
			model: 'User',
			required: true
		},
		// The users that have purchased this addon
		purchasers: {
			collection: 'User',
			via: 'purchases'
		},
		// All transactions related to this addon (purchases, donations, and refunds)
		transactions: {
			collection: 'Transaction',
			via: 'addon'
		},
		// What addons this addon needs installed to function
		dependencies: {
			collection: 'Addon',
			via: 'dependents'
		},
		// What addons require this addon to function
		dependents: {
			collection: 'Addon',
			via: 'dependencies'
		},
		// The comments by users on this addon
		reviews: {
			collection: 'Review',
			via: 'addon'
		},
		// The addon's tags
		tags: {
			collection: 'Tag',
			via: 'addons'
		},
		// The addon's coupons
		coupons: {
			type: 'array',
			defaultsTo: []
		},

		/**
		 * Determines whether or not a user can download this addon.
		 * @param user The user to check.
		 * @returns {boolean} Whether or not the user can download the addon.
		 */
		canDownload: function (user):Boolean {
			// If this is a production env, the user can download an addon if they're the author, an admin, or if it's free
			if (process.env.NODE_ENV === 'production' && (this.author === user.id || user.permissionLevel >= 1 || this.price === 0)) {
				return true;
			}
			// Otherwise they must have purchased it
			for (var i = 0; i < this.purchasers.length; i++) {
				if (this.purchasers[i].id === user.id) return true;
			}
			// If they didn't pass one of the above checks, they cannot download it
			return false;
		},

		/**
		 * Determines whether or not a user can modify this addon.
		 * @param user The user to check.
		 * @returns {boolean} Whether or not the user can modify this addon.
		 */
		canModify: function (user):Boolean {
			return !!(this.author === user.id || user.permissionLevel >= 2);
		},

		/**
		 * @returns {string} This addon's prettified status.
		 */
		prettyStatus: function ():String {
			switch (this.status) {
				case Addon.Status.PENDING:
					return 'Pending';
				case Addon.Status.APPROVED:
					return 'Approved';
				case Addon.Status.DENIED:
					return 'Denied';
				case Addon.Status.LOCKED:
					return 'Locked';
				case Addon.Status.PUBLISHED:
					return 'Published';
				default:
					return "Invalid Status '" + this.status + "'"
			}
		},

		/**
		 * @returns {string} This addon's prettified gamemode.
		 */
		prettyGamemode: function ():String {
			switch (this.gamemode) {
				case Addon.Gamemode.SANDBOX_BASED:
					return 'Sandbox Based';
				case Addon.Gamemode.DARK_RP:
					return 'Dark RP';
				case Addon.Gamemode.TTT:
					return 'TTT';
				case Addon.Gamemode.MURDER:
					return 'Murder';
				case Addon.Gamemode.OTHER:
					return 'Other';
				default:
					return "Invalid Gamemode '" + this.gamemode + "'";
			}
		},

		/**
		 * @returns {string} This addon's prettified type.
		 */
		prettyType: function ():String {
			switch (this.type) {
				case Addon.Type.WEAPON:
					return 'Weapon';
				case Addon.Type.CHATBOX:
					return 'Chatbox';
				case Addon.Type.UTILITY:
					return 'Utility';
				case Addon.Type.OTHER:
					return 'Other';
				default:
					return "Invalid Type '" + this.type + "'"
			}
		},

		/**
		 * @returns {string} This addon's prettified tags.
		 */
		prettyTags: function ():String {
			var returnString = '';
			var splitTags = this.rawTags.split(',');
			splitTags.forEach(function (tag:String):void {
				returnString += tag;
				returnString += ', ';
			});
			// Remove the extra comma before returning
			return returnString.slice(0, -2);
		},

		/**
		 * Increments the total addon count for each tag attached to this addon.
		 * Intended to be used when an addon is published.
		 * @param callback The callback to run once the tags have been incremented.
		 */
		incrementTags: function (callback) {
			// Get the addon's tags in raw format and then parse them into models
			var tagArray:Array<String> = this.rawTags.split(',');
			var findPromises = [];
			tagArray.forEach(tag => findPromises.push(Tag.findOrCreate({name: tag.trim()})));
			// Wait for all of our queries to complete
			Promise.all(findPromises)
				.then(function (tags:Array<Tag>):void {
					// Update every tag with the new addon total
					var updatePromises = [];
					tags.forEach(function (tag) {
						tag.totalAddons++;
						updatePromises.push(tag.save());
					});
					// When the updates complete, fire our callback
					Promise.all(updatePromises).then(callback);
				});
		},

		/**
		 * Decrements the total addon count for each tag attached to this addon.
		 * Intended to be used when an addon is unpublished.
		 * @param callback The callback to run once the tags have been decremented.
		 */
		decrementTags: function decrementTags(callback) {
			// Get the addon's tags in raw format and then parse them into models
			var tagArray:Array<String> = this.rawTags.split(',');
			var findPromises = [];
			tagArray.forEach(function (tag) {
				findPromises.push(Tag.findOne({name: tag.trim()}));
			});
			// Wait for all of our queries to complete
			Promise.all(findPromises)
				.then(function (tags) {
					// Update every tag with the new addon total
					var updatePromises = [];
					tags.forEach(function (tag) {
						if (tag !== undefined) {
							tag.totalAddons--;
							updatePromises.push(tag.save());
						}
					});
					// When the updates complete, fire our callback
					Promise.all(updatePromises).then(callback);
				});
		},

		addCoupon: function addCoupon(code:String, amount:Number, type:Coupon.Type):Promise<void> {
			var prettyType;
			switch (type) {
				case Coupon.Type.PERCENTAGE:
					prettyType = "Percentage";
					break;
				case Coupon.Type.FIXED:
					prettyType = "Fixed";
					break;
				default:
					prettyType = "Invalid Type";
			}

			this.coupons.push({
				code: code,
				amount: amount,
				type: type,
				uses: 0,
				expired: false,
				prettyType: prettyType
			});
			return this.save();
		},

		couponExists: function couponExists(code:String):boolean {
			var exists = false;
			this.coupons.forEach(function (coupon) {
				if (code.toUpperCase() === coupon.code) exists = true;
			});
			return exists;
		},

		isValidCoupon: function isValidCoupon(code:String):boolean {
			var valid = false;
			this.coupons.forEach(function (coupon) {
				if (coupon.code === code.toUpperCase() && coupon.expired === false) valid = true;
			});
			return valid;
		},

		incrementCoupon: function incrementCoupon(code:String):Promise<void> {
			for (var i = 0; i < this.coupons.length; i++) {
				var coupon = this.coupons[i];
				if (coupon.code === code.toUpperCase()) {
					coupon.uses++;
					return this.save();
				}
			}
		},

		decrementCoupon: function decrementCoupon(code:String):Promise<void> {
			for (var i = 0; i < this.coupons.length; i++) {
				var coupon = this.coupons[i];
				if (coupon.code === code.toUpperCase()) {
					coupon.uses--;
					return this.save();
				}
			}
		},

		deactivateCoupon: function deactivateCoupon(code:String):Promise<void> {
			for (var i = 0; i < this.coupons.length; i++) {
				var coupon = this.coupons[i];
				if (coupon.code === code.toUpperCase()) {
					coupon.expired = true;
					return this.save();
				}
			}
		},

		getCoupon: function getCoupon(code:String):Coupon {
			for (var i = 0; i < this.coupons.length; i++) {
				var coupon = this.coupons[i];
				if (coupon.code === code.toUpperCase()) {
					return coupon;
				}
			}
			return null;
		}
	},

	/**
	 * Waterline lifecycle method. Ensures that all files attached to this addon are removed from GridFS when the addon
	 * is destroyed.
	 * @param criteria
	 * @param cb
	 */
	beforeDestroy: function (criteria, cb:Function) {
		Addon.findOne(criteria.where.id)
			.then(function (addon:Addon) {
				sails.hooks.gfs.exist({_id: addon.zipFile}, function (err:Error, found:Boolean) {
						if (err) {
							PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside Addon.beforeDestroy');
							cb(err)
						} else if (found) {
							sails.hooks.gfs.remove({_id: addon.zipFile}, function (err:Error) {
								if (err) PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside Addon.beforeDestroy');
								cb()
							});
						} else {
							cb()
						}
					}
				);
			});

	},

	beforeValidate: function (addon, cb) {
		if (addon.gamemode !== undefined) addon.gamemode = parseInt(addon.gamemode);
		if (addon.type !== undefined) addon.type = parseInt(addon.type);
		if (addon.size !== undefined) addon.size = parseInt(addon.size);
		if (addon.status !== undefined) addon.status = parseInt(addon.status);
		if (addon.price !== undefined) addon.price = parseInt(addon.price);

		cb();
	}
};

module.exports = AddonModel;
