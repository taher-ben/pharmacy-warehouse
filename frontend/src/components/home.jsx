import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Home.css'; // Import the custom CSS file for additional styles
import Sidebar from './sidebar';
import Topbar from './topbar';
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

function Home() {
    const [dataPoints, setDataPoints] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('https://canvasjs.com/data/gallery/react/nifty-stock-price.json')
            .then((response) => response.json())
            .then((data) => {
                const formattedData = data.map((point) => ({
                    x: new Date(point.x),
                    y: point.y,
                }));
                setDataPoints(formattedData);
                setIsLoaded(true);
            })
            .catch((error) => {
                console.error("Error fetching chart data:", error);
            });
    }, []);

    const curveChartOptions = {
        theme: "light2",
        title: {
            text: "Nifty 50 Index",
        },
        data: [
            {
                type: "line",
                xValueFormatString: "MMM YYYY",
                yValueFormatString: "#,##0.00",
                dataPoints: dataPoints,
            },
        ],
    };

    const customerChartOptions = {
        animationEnabled: true,
        title: {
            text: "Number of New Customers",
        },
        axisY: {
            title: "Number of Customers",
        },
        toolTip: {
            shared: true,
        },
        data: [
            {
                type: "spline",
                name: "2016",
                showInLegend: true,
                dataPoints: [
                    { y: 155, label: "Jan" },
                    { y: 150, label: "Feb" },
                    { y: 152, label: "Mar" },
                    { y: 148, label: "Apr" },
                    { y: 142, label: "May" },
                    { y: 150, label: "Jun" },
                    { y: 146, label: "Jul" },
                    { y: 149, label: "Aug" },
                    { y: 153, label: "Sept" },
                    { y: 158, label: "Oct" },
                    { y: 154, label: "Nov" },
                    { y: 150, label: "Dec" },
                ],
            },
            {
                type: "spline",
                name: "2017",
                showInLegend: true,
                dataPoints: [
                    { y: 172, label: "Jan" },
                    { y: 173, label: "Feb" },
                    { y: 175, label: "Mar" },
                    { y: 172, label: "Apr" },
                    { y: 162, label: "May" },
                    { y: 165, label: "Jun" },
                    { y: 172, label: "Jul" },
                    { y: 168, label: "Aug" },
                    { y: 175, label: "Sept" },
                    { y: 170, label: "Oct" },
                    { y: 165, label: "Nov" },
                    { y: 169, label: "Dec" },
                ],
            },
        ],
    };

    const visitorsChartOptions = {
        animationEnabled: true,
        theme: "light2",
        title: {
            text: "New vs Returning Visitors",
        },
        subtitles: [
            {
                text: "Click on Any Segment to Drilldown",
                backgroundColor: "#2eacd1",
                fontSize: 16,
                fontColor: "white",
                padding: 5,
            },
        ],
        data: [
            {
                type: "doughnut",
                innerRadius: "75%",
                dataPoints: [
                    { y: 522460, name: "New Visitors", color: "#E7823A" },
                    { y: 307040, name: "Returning Visitors", color: "#546BC1" },
                ],
            },
        ],
    };

    return (
        <div  dir="rtl" className="home-container d-flex ">
            <Sidebar />
            <div className="content flex-grow-1 d-flex flex-column mx-2">
                <Topbar />
                <div className="p-3">
                    <h1>Dashboard</h1>
                    <div className="mt-4">
                        <h2>Stock Price Chart</h2>
                        {isLoaded ? (
                            <CanvasJSChart options={curveChartOptions} />
                        ) : (
                            <p>Loading chart data...</p>
                        )}
                    </div>
                    <hr />
                    <div className="row mt-4 chart-row">
                        <div className="col-md-6 chart-column">
                            <h2>Number of New Customers</h2>
                            <CanvasJSChart options={customerChartOptions} />
                        </div>
                        <div className="col-md-6 chart-column">
                            <h2>New vs Returning Visitors</h2>
                            <CanvasJSChart options={visitorsChartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
