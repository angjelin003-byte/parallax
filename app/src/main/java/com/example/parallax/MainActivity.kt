package com.example.parallax

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.ScrollView
import android.widget.SeekBar
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null
    private lateinit var wormholeView: WormholeView
    
    private var filteredX = 0f
    private var filteredY = 0f
    private var smoothAlpha = 0.5f

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        wormholeView = findViewById(R.id.wormholeView)
        val menuScroll = findViewById<ScrollView>(R.id.menuScroll)
        
        findViewById<Button>(R.id.btnMinimize).setOnClickListener {
            menuScroll.visibility = if (menuScroll.visibility == View.VISIBLE) View.GONE else View.VISIBLE
        }
        
        findViewById<Button>(R.id.btnClose).setOnClickListener {
            finish()
        }

        findViewById<SeekBar>(R.id.seekRoom).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.roomSize = p.toFloat() }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })

        findViewById<SeekBar>(R.id.seekFlare).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.flare = p / 50f }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        findViewById<SeekBar>(R.id.seekExpansion).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.expansion = p.toFloat() }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        val chkBg = findViewById<CheckBox>(R.id.chkBg)
        chkBg.setOnCheckedChangeListener { _, isChecked -> wormholeView.useBg = isChecked }
        
        findViewById<SeekBar>(R.id.seekHue).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.bgHue = p.toFloat() }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        findViewById<SeekBar>(R.id.seekLines).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.lineMult = (p + 10) / 50f }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        findViewById<SeekBar>(R.id.seekSpin).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { wormholeView.spinSpeed = (p - 50) / 500f }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        findViewById<SeekBar>(R.id.seekSmooth).setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(s: SeekBar?, p: Int, f: Boolean) { smoothAlpha = 1f - (p / 100f) }
            override fun onStartTrackingTouch(s: SeekBar?) {}
            override fun onStopTrackingTouch(s: SeekBar?) {}
        })
        
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }

    override fun onResume() {
        super.onResume()
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event != null) {
            filteredX += smoothAlpha * (event.values[0] - filteredX)
            filteredY += smoothAlpha * (event.values[1] - filteredY)
            
            wormholeView.roll = -filteredX * 0.1f
            wormholeView.pitch = -filteredY * 0.1f
            wormholeView.invalidate()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
