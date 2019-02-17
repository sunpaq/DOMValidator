package com.oreisoft.domvalidator

import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView

class MainActivity : AppCompatActivity() {

    var webView: DVWebView? = null
    var currentPage: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val frame: FrameLayout = findViewById(R.id.web_view_frame)
        val text: TextView = findViewById(R.id.debug_text)
        val button: Button = findViewById(R.id.button_next)

        val web = DVWebView(this)
        web.onDOMSuccess = {
            text.text = "DOM OK"
            setTitle(web.title)
        }
        web.onDOMError = {
            text.text = "DOM ERROR"
            setTitle(web.title)
        }
        webView = web
        frame.addView(webView)

        button.setOnClickListener {
            currentPage++
            if (currentPage >= 11) {
                currentPage = 0
            }
            webView?.loadHTMLFile("check-blank$currentPage.html")
        }
    }

    override fun onResume() {
        super.onResume()
        webView?.loadHTMLFile("check-blank$currentPage.html")
    }
}
