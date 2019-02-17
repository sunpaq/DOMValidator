'use strict';

function DOMCheckerLog() {

    var enable = false;

    this.debug = function(str) {
        if (this.enable) {
            console.log(str);
        }
    };
}

function DOMIFrameChecker(log) {

    this.iframeArray = document.getElementsByTagName('iframe');

    this.getCount = function() {
        return this.iframeArray.length;
    };

    this.check = function(frame, success, error) {
        if (frame.width + frame.height <= 0) {
            log.debug("frame size error");
            error();
        } else {
            var test = document.createElement('iframe');
            test.onload = function(){
                log.debug("frame src check success ");
                success();
            }
            test.onerror = function() {
                log.debug("frame src error");
                error();
            };
            test.src = frame.src;
        }
    }

    this.checkAll = function(singleSuccess, singleError) {
        for (var i=0; i<this.getCount(); ++i) {
            var frame = this.iframeArray[i];
            return this.check(frame, singleSuccess, singleError);
        }
        return false;
    };
}

function DOMVideoChecker(log) {

    this.videoArray = document.getElementsByTagName('video');

    this.getCount = function() {
        return this.videoArray.length;
    };

    this.check = function(video, success, error) {
        if (video.width + video.height <= 0) {
            log.debug("video size error");
            error();
        } else {
            var test = document.createElement('video');
            test.onerror = function() {
                log.debug("video src error");
                error();
            };
            test.onload = function() {
                log.debug("video src check success ");
                success();
            };
            test.src = video.src;
        }
    }

    this.checkAll = function(singleSuccess, singleError) {
        for (var i=0; i<this.getCount(); ++i) {
            var video = this.videoArray[i];
            this.check(video, singleSuccess, singleError);
        }
    };
}

function DOMCanvasChecker(log) {

    this.canvasArray = document.getElementsByTagName('canvas');

    this.getCount = function() {
        return this.canvasArray.length;
    };

    this.checkBlank = function(canvas) {
        if (canvas.width * canvas.height <= 0) {
            return false;
        }
        var blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() == blank.toDataURL();
    };

    this.checkAll = function() {
        var canvasArray = this.canvasArray;
        if (canvasArray.length > 0) {
            for (var i=0; i<canvasArray.length; ++i) {
                var canvas = canvasArray[i];
                if (canvas) {
                    if (this.checkBlank(canvas)) {
                        log.debug("canvas blank error");
                        return false;
                    }
                }
            }
            log.debug("canvas check success");
            return true;
        } else {
            log.debug("no canvas error");
            return false;
        }
    };
}

function DOMImgChecker(log) {

    this.imgArray = document.images;

    this.getCount = function() {
        return this.imgArray.length;
    };

    this.checkBlank = function(canvasChecker, img, success, error) {
        var test = document.createElement('image');
        test.crossOrigin = 'Anonymous';
        test.onerror = function() {
            error();
        };
        test.onload = function() {
            var imgcanvas = document.createElement('canvas');
            var context = imgcanvas.getContext('2d');
            context.drawImage(test, 0, 0, 64, 64);
            if (canvasChecker.checkBlank(imgcanvas)) {
                error();
            } else {
                success();
            }
        };
        test.src = img.src;
    };

    this.check = function(img, success, error) {
        if (img.width * img.height <= 0) {
            log.debug("img size error");
            error();
        } else {
            var test = document.createElement('img');
            test.onerror = function() {
                log.debug("img src error");
                error();
            };
            test.onload = function() {
                log.debug("img src check success ");
                success();
            };
            test.src = img.src;
        }
    };

    this.checkAll = function(singleSuccess, singleError) {
        for (var i=0; i<this.imgArray.length; ++i) {
            var img = this.imgArray[i];
            if (img) {
                this.check(img, singleSuccess, singleError);
            }
        }
    };
}

function DOMTextChecker(log) {

    this.textArray = function() {
        return this.textNodesUnder(document.body);
    };

    this.getCount = function() {
        return this.textArray().length;
    };

    this.textNodesUnder = function(el) {
        var n, a=[], walk=document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        while(n=walk.nextNode()) {
            var text = n.data.trim();
            if (text && text.length > 0) {
                a.push(n);
            }
        }
        return a;
    };

    this.check = function(node) {
        var text = node.data.trim();
        if (text && text.length > 0) {
            log.debug("check text success: [" + text + "]");
            return true;
        }
        log.debug("check text error: [" + text + "]");
        return false;
    };

    this.checkAll = function() {
        var textArray = this.textArray();
        for (var i=0; i<textArray.length; ++i) {
            var textNode = textArray[i];
            if (this.check(textNode)) {
                return true;
            }
        }
        return false;
    };
}

function DOMValidator() {

    this.TIMEOUT = 100;

    this.enableLog = false;

    this.enableRedirect = true;

    this.log = new DOMCheckerLog();

    this.notifyHaveContent = function() {
        this.log.debug("notifyHaveContent");
        if (this.enableRedirect) {
            window.location.replace("dv_callback/have_content");
        }
    };

    this.notifyNoContent = function() {
        this.log.debug("notifyNoContent");
        if (this.enableRedirect) {
            window.location.replace("dv_callback/no_content");
        }
    };

    this.checkDOM = function() {
        var log = this.log;
        if (this.enableLog) {
            log.enable = true;
        }

        var iframeChecker = new DOMIFrameChecker(log);
        var videoChecker = new DOMVideoChecker(log);
        var canvasChecker = new DOMCanvasChecker(log);
        var imgChecker = new DOMImgChecker(log);
        var textChecker = new DOMTextChecker(log);

        var totalIFrameCount = iframeChecker.getCount();
        var totalVideoCount = videoChecker.getCount();
        var totalCanvasCount = canvasChecker.getCount();
        var totalImgCount = imgChecker.getCount();
        var totalTextCount = textChecker.getCount();

        var errorImgCount = 0;
        var successImgCount = 0;

        var errorVideoCount = 0;
        var successVideoCount = 0;
    
        var errorIFrameCount = 0;
        var successIFrameCount = 0;

        log.debug("totalTextCount:" + totalTextCount);
        log.debug("totalImgCount:" +  totalImgCount);
        log.debug("totalCanvasCount:" +  totalCanvasCount);
        log.debug("totalVideoCount:" + totalVideoCount);
        log.debug("totalIFrameCount:" + totalIFrameCount);
    
        if (totalCanvasCount + totalImgCount + totalVideoCount + totalIFrameCount <= 0) {
            if (textChecker.checkAll()) {
                this.notifyHaveContent();
            } else {
                this.notifyNoContent();
            }
            return;
        } else {
            if (totalImgCount > 0) {
                imgChecker.checkAll(function(){
                    log.debug("img success called");
                    ++successImgCount;
                }, function(){
                    log.debug("img error called");
                    ++errorImgCount;
                });
            }

            if (totalIFrameCount > 0) {
                iframeChecker.checkAll(function(){
                    log.debug("iframe success called");
                    ++successIFrameCount; 
                }, function(){
                    log.debug("iframe error called");
                    ++errorIFrameCount;
                });
            }

            if (totalVideoCount > 0) {
                videoChecker.checkAll(function(){
                    log.debug("video success called");
                    ++successVideoCount;
                }, function(){
                    log.debug("video error called");
                    ++errorVideoCount;
                });
            }
    
            if (totalCanvasCount > 0) {
                if (!canvasChecker.checkAll()) {
                    this.notifyNoContent();
                    return;
                }
            }

            var self = this;
            setTimeout(function() {
                if (errorImgCount > 0) {
                    self.notifyNoContent();
                    return;
                }
    
                if (errorIFrameCount > 0) {
                    self.notifyNoContent();
                    return;
                }

                if (errorVideoCount > 0) {
                    self.notifyNoContent();
                    return;
                }

                self.log.debug("no error detected. success");
                self.notifyHaveContent();
            }, this.TIMEOUT);
        }
    };
}
