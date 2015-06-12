/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var ReportModel = {
    schema: true,
    attributes: {
        reporter: {
            model: "User",
            required: true
        },
	    reported: {
            type: "string",
            required: true
        },
        reason: {
            type: 'string',
            required: true
        },
	    body: {
		    type: 'string',
		    required: true
	    },
	    type: {
			type: 'number',
		    required: true
	    },
        status: {
            type: 'number',
            defaultsTo: Report.Status.FILED
        },
        responses: {
            type: 'array',
            defaultsTo: []
        },

	    prettyType: function():string {
		    switch (this.type) {
			    case Report.Type.ADDON:
				    return 'Addon';
			    case Report.Type.USER:
				    return 'User';
			    default:
				    return "Invalid type '" + this.type + "'";
		    }
	    },
	    prettyStatus: function():string {
		    switch (this.status) {
			    case Report.Status.FILED:
				    return 'Filed';
			    case Report.Status.IN_PROGRESS:
				    return 'In Progress';
			    case Report.Status.CLOSED:
				    return 'Closed';
			    default:
				    return "Invalid status '" + this.status + "'";
		    }
	    },
	    addResponse: function(user:User, body:string):Promise<void> {
			this.responses.push({
				user: user.id,
				body: body,
				date: Date.now()
			});
		    return this.save();
	    }
    },

	beforeValidate: function(report, cb) {
		if (typeof report.type === 'string') report.type = parseInt(report.type);
		if (typeof report.status === 'string') report.status = parseInt(report.status);
		cb();
	}
};

module.exports = ReportModel;