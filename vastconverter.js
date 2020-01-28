var IVideoData = {
    placementType: "interstitial",
    orientation: "landscape",
    playmute: false,
    moreInfoTag: "",
    adTitle: "",
    impressions: [],
    mraid: false,
    adVerifications: [],
    macros: {},
    video: {
        poster: "",
        loadingImg: "http://cdn01.adfalcon.com/static/iv2/img/loadingImage.gif",
        url: "",
        duration: 16
    },
    actions: {
        mute: {
            iconMuteURL: "http://cdn01.adfalcon.com/static/iv2/img/muteBtn.png",
            iconUnmuteURL: "http://cdn01.adfalcon.com/static/iv2/img/unmuteBtn.png",
            top: 10,
            left: 10,
            width: 40,
            height: 40

        },
        skip: {
            iconURL: "http://cdn01.adfalcon.com/static/iv2/img/closeBtn.png",
            top: 10,
            right: 10,
            width: 40,
            height: 40,
            skippable: true,
            duration: 3000
        },
        replay: {
            iconURL: "http://cdn01.adfalcon.com/static/iv2/img/replayBtn.png",
            top: 10,
            left: 10,
            width: 40,
            height: 40
        },
        play: {
            iconURL: "http://cdn01.adfalcon.com/static/iv2/img/playBtn.png",
            width: 100,
            height: 100
        }, toolbar: {
            height: 50,
            background: "http://backup1.noqoush.sf.cdngp.net/static/iv/bcktool.png",
            icons: [
                {
                    id: 1,
                    iconURL: "http://cdn01.adfalcon.com/static/iv2/img/moreInfoBtn.png",
                    clickThrough: "",
                    clickTracking: {
                        urls: [],
                        maxCallingCount: 0
                    },
                    width: 153,
                    height: 28
                }
            ]
        }
    },
    trackers: [
    ]

};

function vastParser(vastString) {
    function getDurationInSecond(dur)
    {
        var h = parseInt(dur.substring(0, 2));
        var m = parseInt(dur.substring(3, 5));
        var s = parseInt(dur.substring(6, 8));

        return h * 60 * 60 + m * 60 + s;
    }
    ;

    function getXMLData(xmlDoc, fieldName) {
        var element = null;
        if (fieldName !== null && typeof (fieldName) !== 'undefined') {
            var elements = xmlDoc.getElementsByTagName(fieldName);
            if (typeof elements === 'undefined' || elements === null || elements.length === 0) {
                return "";
            }
            element = elements[0];
        } else {
            element = xmlDoc;
        }
        if (element.firstChild === null)
            return "";

        var childs = element.childNodes;
        var data = "";
        for (var i = 0; i < childs.length; i++) {
            var child = childs[i];
            console.log(child.nodeName);
            if (child.nodeName.indexOf("cdata-section") > 0) {
                data = child.data;
                break;
            }
        }

        if (data === "") {
            data = element.firstChild.data;
        }

        return data.replace(/^\s+|\s+$/gm, '');
    }
    ;

    parser = new DOMParser();
    xmlDoc = parser.parseFromString(vastString, "text/xml");

    var VASTAdTagURIs = xmlDoc.getElementsByTagName("VASTAdTagURI");
    if (VASTAdTagURIs.length > 0) {
        var VASTAdTagURI = getXMLData(xmlDoc, "VASTAdTagURI");

        var index = ++window.wrapperIndex;
        window.wrapperXMLDoc[index] = xmlDoc;
        vastParser.parse = parse;

        if (index >= 5) {
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", VASTAdTagURI, false);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                    vastParser(xhr.responseText);
                } else {
                    console.error(xhr.statusText);
                }
            }
        };
        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };
        xhr.send(null);

        // document.write("<script src=\"http://dev.api.adfalcon.com:8084/AdFalcon/wrapper?VASTAdTagURI=" + encodeURIComponent(VASTAdTagURI) + "\"></scr" + "ipt>");

    } else {
        parse(xmlDoc);
        for (var i = window.wrapperIndex; i > -1; i--) {
            parse(window.wrapperXMLDoc[i]);
        }

    }

    function parse(xmlDoc) {

        function putMacro(k, v) {
            IVideoData.macros[k] = v;
        }
        //is wrapper
        var VASTAdTagURIs = xmlDoc.getElementsByTagName("VASTAdTagURI");
        var isWrapper = VASTAdTagURIs.length > 0;


//Add impression
        var Impressions = xmlDoc.getElementsByTagName("Impression");
        for (var i = 0; i < Impressions.length; i++) {
            var imp = getXMLData(Impressions[i]);
            IVideoData.impressions.push(imp);
            adfalcon_impression_url = imp;
        }

//Add ad title
        if (!isWrapper) {
            var AdTitle = getXMLData(xmlDoc, "AdTitle");
            IVideoData.adTitle = AdTitle;

            //AdServingId
            var AdServingId = getXMLData(xmlDoc, "AdServingId");
            putMacro("[ADSERVINGID]", AdServingId);
            putMacro("[ADTYPE]", "video");
            putMacro("[DEVICEUA]", encodeURIComponent(navigator.userAgent));
            putMacro("[CLIENTUA]", "AdFalcon/3.0 Interstitial/3.0");
            putMacro("[DOMAIN]", encodeURIComponent(window.location));




            //UniversalAdId idRegistry="Ad-ID" idValue
            var UniversalAdIds = xmlDoc.getElementsByTagName("UniversalAdId");
            if (UniversalAdIds.length > 0) {
                var UniversalAdId = UniversalAdIds[0];
                var idRegistry = UniversalAdId.attributes["idRegistry"].nodeValue;
                var idValue = getXMLData(UniversalAdId);
                if (!idValue || idValue === "" || idValue.length == 0) {
                    idValue = UniversalAdId.attributes["idValue"].nodeValue;
                }

                putMacro("[UNIVERSALADID]", idRegistry + " " + idValue);
            }

        }
//Add Video
        var Creatives = xmlDoc.getElementsByTagName("Creatives");
        var Linear = undefined;
        for (var i = 0; i < Creatives.length; i++) {
            var Creative = Creatives[0];
            if (Creative.getElementsByTagName("Linear").length > 0) {
                Linear = Creative.getElementsByTagName("Linear")[0];
                break;
            }
        }
        if (Linear) {
            var skipoffset = Linear.attributes["skipoffset"];
            if (!isWrapper && typeof (skipoffset) !== 'undefined' && skipoffset !== null) {
                skipoffset = skipoffset.nodeValue;
                IVideoData.actions.skip.skippable = true;
                IVideoData.actions.skip.duration = getDurationInSecond(skipoffset) * 1000;
            }

        }
        if (!isWrapper && Linear.getElementsByTagName("MediaFile").length > 0) {


            var Duration = Linear.getElementsByTagName("Duration")[0].textContent;

            var mediaFiles = Linear.getElementsByTagName("MediaFile");
            for (var i = 0; i < mediaFiles.length; i++) {
                var mediaFile = mediaFiles[0];

                var isValidType = (mediaFile.attributes["type"].nodeValue === "video/mp4");
                if (isValidType) {
                    var width = parseInt(mediaFile.attributes["width"].nodeValue);
                    var height = parseInt(mediaFile.attributes["height"].nodeValue);
                    if (height > width) {
                        IVideoData.orientation = "portrait";
                    }
                    var videoUrl = getXMLData(Linear, "MediaFile");//mediaFile.firstChild.data;
                    putMacro("[ASSETURI]", encodeURIComponent(videoUrl));
                    IVideoData.video.url = videoUrl;
                    IVideoData.video.duration = getDurationInSecond(Duration);
                    break;
                }
            }
        }

//Extension
        if (!isWrapper) {
            var VideoClicksCTA = "More Info>>";
            var VideoClicksStaticResource = "http://cdn01.adfalcon.com/static/iv2/img/moreInfoBtn.png";
            var VideoClicksStaticResourceWidth = 153;
            var VideoClicksStaticResourceHeight = 28;

            var CustomVideoClicks = xmlDoc.getElementsByTagName("CustomVideoClicks");
            if (CustomVideoClicks.length > 0) {
                CustomVideoClicks = CustomVideoClicks[0];
                VideoClicksCTA = getXMLData(CustomVideoClicks, "CTA");
                VideoClicksStaticResource = getXMLData(CustomVideoClicks, "StaticResource");
                VideoClicksStaticResourceWidth = parseInt(CustomVideoClicks.attributes["width"].nodeValue);
                VideoClicksStaticResourceHeight = parseInt(CustomVideoClicks.attributes["height"].nodeValue);
            }

//Add Tool Bar

            var VideoClicks = Linear.getElementsByTagName("VideoClicks");
            if (VideoClicks.length > 0) {
                VideoClick = VideoClicks[0];
                var ClickThrough = getXMLData(VideoClick, "ClickThrough"); //VideoClicks.getElementsByTagName("ClickThrough")[0].firstChild.data;
                IVideoData.actions.toolbar.icons[0].clickThrough = ClickThrough;

                var ClickTrackings = VideoClick.getElementsByTagName("ClickTracking");
                for (var i = 0; i < ClickTrackings.length; i++) {
                    var ClickTracking = getXMLData(ClickTrackings[i]);// VideoClicks.getElementsByTagName("ClickTracking")[0].firstChild.data;
                    IVideoData.actions.toolbar.icons[0].clickTracking.urls.push(ClickTracking);
                }

                IVideoData.actions.toolbar.icons[0].iconURL = VideoClicksStaticResource;
                IVideoData.actions.toolbar.icons[0].width = VideoClicksStaticResourceWidth;
                IVideoData.actions.toolbar.icons[0].height = VideoClicksStaticResourceHeight;
                IVideoData.moreInfoTag = "<a id='miniCTA' href='" + ClickThrough + "' target='_blank' onclick='var img = new Image();img.src = \"" + ClickTracking + "\";'>" + VideoClicksCTA + "</a>";
                //IVideoData.moreInfoTag = "<a id='miniCTA' href='" + ClickThrough + "' target='_blank' onclick='var img = new Image();img.src = \"" + ClickTracking + "\";'><img id='miniImgCTA' src='"+VideoClicksStaticResource+"'/></a>";
            } else {
                //IVideoData.actions.toolbar.icons = [];
            }

        } else if (Linear) {
            var VideoClicks = Linear.getElementsByTagName("VideoClicks");
            for (var ivc = 0; ivc < VideoClicks.length; ivc++) {
                VideoClick = VideoClicks[ivc];
                var ClickTrackings = VideoClick.getElementsByTagName("ClickTracking");
                for (var i = 0; i < ClickTrackings.length; i++) {
                    var ClickTracking = getXMLData(ClickTrackings[i]);// VideoClicks.getElementsByTagName("ClickTracking")[0].firstChild.data;
                    IVideoData.actions.toolbar.icons[0].clickTracking.urls.push(ClickTracking);
                }
            }
        }

//Trackings
        if (Linear) {
            var TrackingEvents = Linear.getElementsByTagName("Tracking");
            for (var i = 0; i < TrackingEvents.length; i++) {
                var Tracking = TrackingEvents[i];
                var event = Tracking.attributes["event"].nodeValue;
                var trackerUrl = getXMLData(Tracking);
                var tracker = {
                    event: "timeupdate",
                    urls: [],
                    value: -1,
                    maxCallingCount: 0
                };

                if (event === 'creativeView') {
                    tracker.maxCallingCount = 1;
                    tracker.value = 1;
                } else if (event === 'start') {
                    tracker.value = 1;
                } else if (event === 'firstQuartile') {
                    tracker.value = parseInt(IVideoData.video.duration / 4);
                } else if (event === 'midpoint') {
                    tracker.value = parseInt(IVideoData.video.duration / 2);
                } else if (event === 'thirdQuartile') {
                    tracker.value = parseInt(IVideoData.video.duration / 4) * 3;
                } else if (event === 'progress') {
                    var offset = Tracking.attributes["offset"].nodeValue;
                    if (offset.indexOf("%") > 0) {
                        var percent = parseInt(offset);
                        tracker.value = parseInt(IVideoData.video.duration * percent / 100);
                    } else {
                        tracker.value = getDurationInSecond(offset);
                    }
                } else {
                    tracker.event = "statechange";
                    tracker.value = event;
                }
                tracker.urls.push(trackerUrl);
                IVideoData.trackers.push(tracker);
            }
        }
//AdVerifications
        var Verifications = xmlDoc.getElementsByTagName("Verification");
        var shouldInsertOMID = false;
        for (var i = 0; i < Verifications.length; i++) {

            var object = {};
            var Verification = Verifications[i];

            //vendor key
            var vendor = Verification.attributes["vendor"].nodeValue;
            object.vendor = vendor;

            if (vendor === "Moat") {
                //will parse soon

            } else {

                //adding verification parameters
                var VerificationParameters = getXMLData(Verification, "VerificationParameters");
                if (VerificationParameters) {
                    object.verificationParameters = VerificationParameters;
                }

                //adding javascript resources
                var JavaScriptResource = Verification.getElementsByTagName("JavaScriptResource");
                if (JavaScriptResource.length > 0) {
                    var apiFramework = JavaScriptResource[0].attributes["apiFramework"].nodeValue;
                    var url = getXMLData(Verification, "JavaScriptResource");
                    object.javaScriptResourceUrl = url;
                    object.apiFramework = apiFramework;

                    IVideoData.adVerifications.push(object);

                    if (apiFramework === "omid") {
                        shouldInsertOMID = true;
                    }
                }
            }
        }

        if (shouldInsertOMID) {
            document.write("<script src='https://cdn01.static.adfalcon.com/static/iv2/2.3/omidmanager.js'></script>");
        }

//Companion Ad
        var CompanionAds = xmlDoc.getElementsByTagName("CompanionAds");
        if (CompanionAds.length > 0) {
            CompanionAds = CompanionAds[0];
            var CompanionAd = CompanionAds.getElementsByTagName("Companion")[0];
            var comWidth = parseInt(CompanionAd.attributes["width"].nodeValue);
            var comHeight = parseInt(CompanionAd.attributes["height"].nodeValue);
            var CompanionClickThrough = getXMLData(CompanionAd, "CompanionClickThrough");
            var CompanionClickTracking = getXMLData(CompanionAd, "CompanionClickTracking");

            var TrackingURL = getXMLData(CompanionAd, "Tracking");
            var StaticResource = getXMLData(CompanionAd, "StaticResource");
            var IFrameResource = getXMLData(CompanionAd, "IFrameResource");
            var HTMLResource = getXMLData(CompanionAd, "HTMLResource");

            var w = comWidth;
            var h = comHeight;
            if (StaticResource === "") {
                if (w > 400 && h > 270) {
                    w = "100%";
                    h = "100%"
                }
            }
            var CompanionAdContent = "<div style='width:" + w + ";height:" + h + ";'>";
            if (StaticResource !== "") {
                CompanionAdContent += "<img src='" + StaticResource + "' style='width:" + w + ";height:" + h + "' width=" + w + " height=" + h + "></img>";
            } else if (IFrameResource !== "") {

                CompanionAdContent += "<iframe src='" + IFrameResource + "' style='width:" + w + ";height:" + h + "' width=" + w + " height=" + h + "></iframe>";
            } else if (HTMLResource !== "") {
                CompanionAdContent += HTMLResource;
            }

            CompanionAdContent += "</div>";

            if (CompanionClickThrough !== "") {
                CompanionAdContent = "<a href='" + CompanionClickThrough + "' target='_blank'>" + CompanionAdContent + "</a>";
            }

            if (TrackingURL !== "") {
                CompanionAdContent += "<img src='" + TrackingURL + "' width='1' height='1' style='position:absolute; visibility:hidden'/>";
            }
            CompanionAdContent = "<table style='width:100%; height:100%;margin:0px;padding:0px;border:0px;z-index: 1;'><tr><td align='center'>" + CompanionAdContent + "</td></tr></table>";

            if (comHeight < 100 && StaticResource !== "") {
                var icon = {
                    id: 2,
                    iconURL: StaticResource,
                    clickThrough: CompanionClickThrough,
                    clickTracking: {
                        urls: [TrackingURL],
                        maxCallingCount: 0
                    },
                    width: comWidth,
                    height: comHeight
                };
                IVideoData.actions.toolbar.icons = [];
                IVideoData.actions.toolbar.icons.push(icon);
            } else {
                IVideoData.endCard = {htmlResource: CompanionAdContent};
            }


        } else {
            if (IVideoData.actions.toolbar.icons.length === 0) {
                // IVideoData.actions.toolbar = null;
            }
        }

    }


}
window.wrapperXMLDoc = [];
window.wrapperIndex = -1;
vastParser(VAST);
