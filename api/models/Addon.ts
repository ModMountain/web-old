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
    // Whether or not this addon is featured on the home page
    featured: {
      type: 'boolean',
      defaultsTo: false
    },
    // The addon's tags in raw (comma separated) format
    rawTags: {
      type: 'string',
      defaultsTo: ""
    },
    images: {
      type: 'array',
      defaultsTo: []
    },
    videos: {
      type: 'array',
      defaultsTo: []
    },
    cardImage: {
      type: 'string',
      required: true
    },
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
    //reviews: {
    //  collection: 'Review',
    //  via: 'addon'
    //},
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
    versions: {
      collection: 'AddonVersion',
      via: 'addon'
    },
    events: {
      type: 'array',
      defaultsTo: []
    },

    /**
     * Determines whether or not a user can download this addon.
     * @param user The user to check.
     * @returns {boolean} Whether or not the user can download the addon.
     */
    canDownload: function canDownload(user):Boolean {
      // Free addons are always downloadable without a login
      if (this.price === 0) return true;

      // Paid addons require a user to be logged in, so this is easy to filter out
      if (!user) return false;

      // If this user authored this addon or is an administrator, they may download it
      if (this.author === user.id || user.permissionLevel >= 1) return true;

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
    canModify: function canModify(user):Boolean {
      // Anonymous users cannot make modifications
      if (!user) return false;
      // The author can make modifications
      else if (this.author === user.id || this.author.id === user.id) return true;
      // Administrators can make modifications
      else if (user.permissionLevel >= 2) return true;
      // Failed all other checks
      else return false;
    },

    /**
     * @returns {string} This addon's prettified status.
     */
    prettyStatus: function prettyStatus():String {
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
    prettyGamemode: function prettyGamemode():String {
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
     * @returns {string} This addon's prettified tags.
     */
    prettyTags: function prettyTags():String {
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
    incrementTags: function incrementTags(callback) {
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
    },

    addImage: function addImage(objectId:string):Promise<void> {
      this.images.push({
        objectId: objectId,
        originalId: objectId,
        banner: false,
        card: false,
        highlight: false
      });
      return this.save();
    },

    removeImage: function removeImage(objectId:string):Promise<any> {
      return new Promise(function (resolve, reject) {
        for (var i = 0; i < this.images.length; i++) {
          if (this.images[i].originalId === objectId) {
            this.images.slice(i, 1);
            return this.save(resolve);
          }
        }
        reject(new Error("No image found with ID " + objectId));
      });
    },

    modifyImage: function modifyImage(objectId:string, newType:Addon.Image.Type):Promise<any> {
      return new Promise(function (resolve, reject) {
        for (var i = 0; i < this.images.length; i++) {
          var image = this.images[i];
          // Ensure that there is only one banner or card image
          if (newType === Addon.Image.Type.BANNER && image.type === Addon.Image.Type.BANNER) image.type = Addon.Image.Type.NORMAL;
          if (newType === Addon.Image.Type.CARD && image.type === Addon.Image.Type.CARD) image.type = Addon.Image.Type.NORMAL;

          if (image.originalId === objectId) {
            image.type = newType;
            // Exit early
            if (newType === Addon.Image.Type.NORMAL || newType === Addon.Image.Type.HIGHLIGHT) return this.save(resolve);
          }
        }
        reject(new Error("No image found with ID " + objectId));
      });
    },

    addVideo: function addVideo(id:string, type:Addon.Video.Type):Promise<void> {
      this.videos.push({
        id: id,
        type: type,
        highlight: false
      });
      return this.save();
    },

    removeVideo: function removeVideo(id:string):Promise<any> {
      return new Promise(function (resolve, reject) {
        for (var i = 0; i < this.videos.length; i++) {
          if (this.videos[i].id === id) {
            this.videos.slice(i, 1);
            return this.save(resolve);
          }
        }
        return reject(new Error("No video found with ID " + id));
      });
    },

    modifyVideo: function modifyVideo(id:string, newType:Addon.Video.Type):Promise<any> {
      return new Promise(function (resolve, reject) {
        for (var i = 0; i < this.videos.length; i++) {
          var video = this.videos[i];
          if (video.id === id) {
            video.type = newType;
            return this.save(resolve);
          }
        }
        return reject(new Error("No video found with ID " + id));
      });
    }
  },

  /**
   * Waterline lifecycle method. Ensures that all files attached to this addon are removed from GridFS when the addon
   * is destroyed.
   * @param criteria
   * @param cb
   */
  beforeDestroy: function beforeDestroy(criteria, cb:Function) {
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

  beforeValidate: function beforeValidate(addon, cb) {
    if (addon.gamemode !== undefined) addon.gamemode = parseInt(addon.gamemode);
    if (addon.type !== undefined) addon.type = parseInt(addon.type);
    if (addon.size !== undefined) addon.size = parseInt(addon.size);
    if (addon.status !== undefined) addon.status = parseInt(addon.status);
    if (addon.price !== undefined) addon.price = parseInt(addon.price);
    if (addon.rawTags) addon.rawTags = addon.rawTags.toLowerCase();

    // Dirty hack because waterline is a POS
    if (addon.reviews && addon.reviews.length === 0) addon.reviews = undefined;
    cb();
  },

  afterValidate: function(addon, cb) {
    cb();
  }
};

module.exports = AddonModel;
