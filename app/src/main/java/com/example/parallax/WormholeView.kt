package com.example.parallax

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
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

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        canvas.drawColor(Color.BLACK)
        
        val w = width.toFloat()
        val h = height.toFloat()
        val cx = w / 2f
        val cy = h / 2f
        
        val b = 150f
        val numU = 40
        val numV = 24
        val points = Array(numU) { Array(numV) { FloatArray(3) } }
        
        val uMin = -800f
        val uMax = 800f
        val uStep = (uMax - uMin) / (numU - 1)
        
        for (i in 0 until numU) {
            val u = uMin + i * uStep
            val r = sqrt(u * u + b * b)
            for (j in 0 until numV) {
                val v = j * 2 * Math.PI / numV
                val x = (r * cos(v)).toFloat()
                val y = (r * sin(v)).toFloat()
                val z = u
                
                val y1 = (y * cos(pitch) - z * sin(pitch)).toFloat()
                val z1 = (y * sin(pitch) + z * cos(pitch)).toFloat()
                val x2 = (x * cos(roll) + z1 * sin(roll)).toFloat()
                val z2 = (-x * sin(roll) + z1 * cos(roll)).toFloat()
                
                points[i][j][0] = x2
                points[i][j][1] = y1
                points[i][j][2] = z2
            }
        }
        
        val d = 1200f
        val scale = 1000f
        
        fun project(p: FloatArray): FloatArray {
            val z = p[2] + d
            if (z <= 0.1f) return floatArrayOf(-10000f, -10000f)
            val f = scale / z
            return floatArrayOf(p[0] * f + cx, p[1] * f + cy)
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
    }
}
