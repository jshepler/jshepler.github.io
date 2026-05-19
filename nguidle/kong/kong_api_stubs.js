var kongregateAPI = {
    unityGameInstance: null,
    unityElementId: null,
    disableUnityErrorHandler: true,
    
    _flashVarsObject: {
        kongregate: "false",
        kongregate_host: encodeURIComponent(window.location.origin),
        kongregate_channel_id: "0"
    },
    
    loadAPI: function(callback) {
        if (typeof callback === "function") setTimeout(callback, 0);
    },
    getAPI: function() { return this._services; },
    getVariable: function(key) { return this._flashVarsObject[key]; },
    flashVarsObject: function() { return this._flashVarsObject; },
    flashVarsString: function() { return ""; },
    
    _services: {
        services: {
            getUserId: function() { return 0; },
            getUserID: function() { return 0; },
            getUsername: function() { return "Guest"; },
            getGameAuthToken: function() { return ""; },
            getGameId: function() { return 0; },
            getGameID: function() { return 0; },
            isGuest: function() { return true; },
            isKongregate: function() { return false; },
            isExternal: function() { return true; },
            isConnected: function() { return false; },
            connect: function() {},
            addEventListener: function() {},
            sendMessage: function() {}
        },
        stats: {
            submit: function() {},
            submitArray: function() {}
        },
        chat: {
            showTab: function() {},
            closeTab: function() {},
            displayMessage: function() {},
            clearMessages: function() {},
            addEventListener: function() {}
        },
        mtx: {
            requestItemList: function(tags, cb) { if (cb) cb({ success: false, data: [] }); },
            requestUserItemList: function(user, cb) { if (cb) cb({ success: false, data: [] }); },
            purchaseItems: function(items, cb) { if (cb) cb({ success: false }); },
            purchaseItemsRemote: function(info, cb) { if (cb) cb({ success: false }); },
            useItemInstance: function(id, cb) { if (cb) cb({ success: false }); },
            showKredPurchaseDialog: function() {},
            initializeIncentivizedAds: function() {},
            showIncentivizedAd: function() {},
            addEventListener: function() {}
        },
        analytics: {
            addEvent: function() {},
            setCommonProperties: function() {},
            setCommonPropsCallback: function() {},
            addFilterType: function() {},
            getAutoStringProperty: function() { return null; },
            getAutoIntProperty: function() { return 0; },
            getAutoBoolProperty: function() { return false; },
            getAutoDoubleProperty: function() { return 0; },
            getAutoPropertiesJSON: function() { return "{}"; },
            setAutomaticVariablesListener: function() {},
            startPurchase: function() {},
            finishPurchase: function() {}
        },
        images: {
            submitAvatar: function(img, cb) { if (cb) cb({ success: false }); }
        },
        sharedContent: {
            save: function(type, data, cb) { if (cb) cb({ success: false }); },
            browse: function() {},
            addLoadListener: function() {}
        }
    }
};

var kongregate = kongregateAPI.getAPI();

var kongregateUnitySupport = {
    initAPI: function(obj, cb) {
        if (kongregateAPI.unityGameInstance && typeof kongregateAPI.unityGameInstance.SendMessage === "function") {
            var userInfo = [
                kongregateAPI._services.services.getUserId(),
                kongregateAPI._services.services.getUsername(),
                kongregateAPI._services.services.getGameAuthToken()
            ].join("|");
            kongregateAPI.unityGameInstance.SendMessage(obj, cb, userInfo);
        }
    },
    hijackUnityErrorHandler: function() {}
};