package com.oreisoft.domvalidator

import android.annotation.TargetApi
import android.content.Context
import android.util.Log
import android.webkit.*
import java.io.BufferedReader
import java.io.File
import java.io.IOException
import java.io.InputStreamReader

class DVWebView(context: Context) : WebView(context){

    var onDOMSuccess: ((String) -> Unit)? = null

    var onDOMError: ((String) -> Unit)? = null

    init {
        webViewClient = DVClient()
        webChromeClient = DVChromeClient()

        settings.javaScriptEnabled = true
        settings.allowContentAccess = true
        settings.domStorageEnabled = true
        settings.loadsImagesAutomatically = true

        @TargetApi(16)
        settings.allowUniversalAccessFromFileURLs = true
        settings.setAppCacheEnabled(true)
    }

    fun loadHTML(html: String) {
        loadDataWithBaseURL("http://www.google.com", html, "text/html", "utf-8", null)
    }

    fun loadHTMLFile(filename: String) {
        val html = readAssetFile(filename)
        loadDataWithBaseURL("http://www.google.com", html, "text/html", "utf-8", null)
    }

    fun readAssetFile(name: String) : String {
        var reader: BufferedReader? = null
        var code: String = ""
        try {
            reader = BufferedReader(InputStreamReader(context.getAssets().open(name)))

            // do reading, usually loop until end of file reading
            var line : String? = null;
            while (line != null) {
                line = reader.readLine()
                code += line
            }
        } catch (e: IOException) {
            e.printStackTrace()
        } finally {
            reader?.let {
                try {
                    it.close();
                } catch (e: IOException) {
                    e.printStackTrace()
                }
            }
        }
        return code.trimIndent();
    }

    inner class DVClient : WebViewClient() {

        fun injectJS(webView: WebView, jscode: String) {
            val url = """javascript:(function(){
                $jscode

                var validator = new DOMValidator();
                validator.enableLog = true;
                validator.enableRedirect = true;
                validator.checkDOM();
            })()""".trimIndent()
            webView.loadUrl(url)
        }

        fun handleCallback(url: String?) : Boolean {
            url?.let {
                if (it.contains("dv_callback")) {
                    if (it.contains("have_content")) {
                        Log.d("JS", "DOM validate have_content")
                        onDOMSuccess?.invoke("success")
                    } else {
                        Log.d("JS", "DOM validate no_content")
                        onDOMError?.invoke("error")
                    }
                    return true
                }
            }
            return false
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            Log.d("JS", "onPageFinished: $url")
            view?.let {
                //injectJS(it, readAssetFile("DOMValidator.js"))
                injectJS(it, JS.code)
            }
        }

        override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
            Log.d("JS", "onReceivedHttpError: ${errorResponse.toString()}")
        }

        @TargetApi(21)
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            Log.d("JS", "shouldOverrideUrlLoading")
            request?.let {
                it.url.toString().let {
                    return handleCallback(it)
                }
            }
            return false
        }

    }

    inner class DVChromeClient : WebChromeClient() {

        override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
            consoleMessage?.let {
                if (it.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                    Log.d("JS Error", "line:${it.lineNumber()} ${it.message()}")
                }
                else if (it.messageLevel() == ConsoleMessage.MessageLevel.DEBUG) {
                    Log.d("JS Debug", it.message())
                } else {
                    Log.d("JS", it.message())
                }
            }
            return false
        }
    }
}