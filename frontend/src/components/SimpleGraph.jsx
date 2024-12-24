import React from "react";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";
import { Bar } from "react-chartjs-2";

// تسجيل المقاييس والعناصر المطلوبة
ChartJS.register(BarElement, CategoryScale, LinearScale);

const SimpleGraph = () => {
  const data = {
    labels: ["Node 1", "Node 2"], // أسماء القمم
    datasets: [
      {
        label: "Values",
        data: [10, 15], // قيم الأعمدة
        backgroundColor: ["blue", "red"], // ألوان الأعمدة
        borderColor: ["darkblue", "darkred"], // لون الحواف
        borderWidth: 1, // عرض الحواف
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true, // إظهار وسيلة الإيضاح
      },
    },
    scales: {
      y: {
        beginAtZero: true, // يبدأ المحور من الصفر
      },
    },
  };

  // هنا نضيف المفتاح لضمان إعادة الرسم
  return <Bar key={Math.random()} data={data} options={options} />;
};

export default SimpleGraph;
