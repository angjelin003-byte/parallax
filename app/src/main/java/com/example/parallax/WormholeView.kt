package com.example.parallax

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

class WormholeView(context: Context, attrs: AttributeSet?) : View(context, attrs) {
    private val paint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 3f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }
    
    var pitch = 0f
    var roll = 0f
    var expansion = 150f
    var flare = 0f
    var roomSize = 800f
    var bgHue = 0f
    var useBg = false
    var lineMult = 1f
    var spinSpeed = 0f
    private var currentSpin = 0f

    // 2-finger touch rotation states
    private var touchRotX = 0f
    private var touchRotY = 0f
    private var touchRotZ = 0f
    private var lastTouchX = 0f
    private var lastTouchY = 0f
    private var lastTouchAngle = 0f

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.pointerCount == 2) {
            val x1 = event.getX(0)
            val y1 = event.getY(0)
            val x2 = event.getX(1)
            val y2 = event.getY(1)

            val cx = (x1 + x2) / 2f
            val cy = (y1 + y2) / 2f
            val angle = Math.toDegrees(atan2((y2 - y1).toDouble(), (x2 - x1).toDouble())).toFloat()

            when (event.actionMasked) {
                MotionEvent.ACTION_POINTER_DOWN -> {
                    lastTouchX = cx
                    lastTouchY = cy
                    lastTouchAngle = angle
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = cx - lastTouchX
                    val dy = cy - lastTouchY
                    val dAngle = angle - lastTouchAngle

                    touchRotY += dx * 0.005f
                    touchRotX += dy * 0.005f
                    touchRotZ += Math.toRadians(dAngle.toDouble()).toFloat()

                    lastTouchX = cx
                    lastTouchY = cy
                    lastTouchAngle = angle
                    invalidate()
                }
            }
        }
        return true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        if (useBg) {
            canvas.drawColor(Color.HSVToColor(floatArrayOf(bgHue, 1f, 0.3f)))
        } else {
            canvas.drawColor(Color.BLACK)
        }
        
        val w = width.toFloat()
        val h = height.toFloat()
        val cx = w / 2f
        val cy = h / 2f
        
        val d = 1200f
        val scale = 1000f
        
        fun project(p: FloatArray): FloatArray {
            val z = p[2] + d
            if (z <= 0.1f) return floatArrayOf(-10000f, -10000f)
            val f = scale / z
            return floatArrayOf(p[0] * f + cx, p[1] * f + cy)
        }

        // Draw Room (World Space - Accelerometer Only)
        if (roomSize > 10f) {
            val s = roomSize
            val cube = arrayOf(
                floatArrayOf(-s, -s, -s), floatArrayOf(s, -s, -s),
                floatArrayOf(s, s, -s), floatArrayOf(-s, s, -s),
                floatArrayOf(-s, -s, s), floatArrayOf(s, -s, s),
                floatArrayOf(s, s, s), floatArrayOf(-s, s, s)
            )

            val pCube = Array(8) { FloatArray(2) }
            for (i in 0..7) {
                val rx = cube[i][0]
                val ry = cube[i][1]
                val rz = cube[i][2]

                val y1 = (ry * cos(pitch) - rz * sin(pitch)).toFloat()
                val z1 = (ry * sin(pitch) + rz * cos(pitch)).toFloat()
                val x2 = (rx * cos(roll) + z1 * sin(roll)).toFloat()
                val z2 = (-rx * sin(roll) + z1 * cos(roll)).toFloat()

                pCube[i] = project(floatArrayOf(x2, y1, z2))
            }

            // Draw Back Wall
            canvas.drawLine(pCube[4][0], pCube[4][1], pCube[5][0], pCube[5][1], paint)
            canvas.drawLine(pCube[5][0], pCube[5][1], pCube[6][0], pCube[6][1], paint)
            canvas.drawLine(pCube[6][0], pCube[6][1], pCube[7][0], pCube[7][1], paint)
            canvas.drawLine(pCube[7][0], pCube[7][1], pCube[4][0], pCube[4][1], paint)

            // Draw Side Walls (Connecting lines to the invisible front face)
            canvas.drawLine(pCube[0][0], pCube[0][1], pCube[4][0], pCube[4][1], paint)
            canvas.drawLine(pCube[1][0], pCube[1][1], pCube[5][0], pCube[5][1], paint)
            canvas.drawLine(pCube[2][0], pCube[2][1], pCube[6][0], pCube[6][1], paint)
            canvas.drawLine(pCube[3][0], pCube[3][1], pCube[7][0], pCube[7][1], paint)
        }

        // Draw Wormhole (Local Space - Touch Rotation + Accelerometer)
        val numU = (40 * lineMult).toInt().coerceAtLeast(4)
        val numV = (24 * lineMult).toInt().coerceAtLeast(4)
        val points = Array(numU) { Array(numV) { FloatArray(3) } }
        
        val uMin = -800f
        val uMax = 800f
        val uStep = (uMax - uMin) / (numU - 1)
        
        currentSpin += spinSpeed
        
        for (i in 0 until numU) {
            val u = uMin + i * uStep
            // Added flare mechanic for expanding exits exponentially
            val r = sqrt(u * u + expansion * expansion) + flare * (u * u / 500f)
            
            for (j in 0 until numV) {
                val v = j * 2 * Math.PI / numV + currentSpin
                
                var x = (r * cos(v)).toFloat()
                var y = (r * sin(v)).toFloat()
                var z = u

                // Apply 2-finger twist (Z)
                var tx = x * cos(touchRotZ) - y * sin(touchRotZ)
                var ty = x * sin(touchRotZ) + y * cos(touchRotZ)
                x = tx.toFloat(); y = ty.toFloat()

                // Apply 2-finger drag (X)
                var ty2 = y * cos(touchRotX) - z * sin(touchRotX)
                var tz2 = y * sin(touchRotX) + z * cos(touchRotX)
                y = ty2.toFloat(); z = tz2.toFloat()

                // Apply 2-finger drag (Y)
                var tx3 = x * cos(touchRotY) + z * sin(touchRotY)
                var tz3 = -x * sin(touchRotY) + z * cos(touchRotY)
                x = tx3.toFloat(); z = tz3.toFloat()
                
                // Apply Accelerometer (Pitch/Roll)
                val y1 = (y * cos(pitch) - z * sin(pitch)).toFloat()
                val z1 = (y * sin(pitch) + z * cos(pitch)).toFloat()
                val x2 = (x * cos(roll) + z1 * sin(roll)).toFloat()
                val z2 = (-x * sin(roll) + z1 * cos(roll)).toFloat()
                
                points[i][j][0] = x2
                points[i][j][1] = y1
                points[i][j][2] = z2
            }
        }
        
        for (i in 0 until numU) {
            for (j in 0 until numV) {
                val p1 = project(points[i][j])
                val p2 = project(points[i][(j + 1) % numV])
                if (p1[0] > -1000f && p2[0] > -1000f) {
                    canvas.drawLine(p1[0], p1[1], p2[0], p2[1], paint)
                }
            }
        }
        
        for (j in 0 until numV) {
            for (i in 0 until numU - 1) {
                val p1 = project(points[i][j])
                val p2 = project(points[i + 1][j])
                if (p1[0] > -1000f && p2[0] > -1000f) {
                    canvas.drawLine(p1[0], p1[1], p2[0], p2[1], paint)
                }
            }
        }
        
        if (spinSpeed != 0f) invalidate()
    }
}
