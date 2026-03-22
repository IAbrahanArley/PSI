"use client"
import { Fragment } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(
    () => import('react-apexcharts').then((mod) => mod.default),
    { ssr: false }
);

const DiagnosisReport = () =>{
    const series = [82];
    const options : ApexOptions ={        
        chart: {
            type: 'radialBar',
            offsetY: -15,           
            offsetX: -35,
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    size: '78%',
                },
                track: {
                    background: "var(--bs-primary-bg-subtle)",
                    strokeWidth: '80%',
                },
                dataLabels: {
                    name: {
                        show: false
                    },
                    value: {
                        offsetY: 15,
                        fontSize: '50px',
                        color: 'var(--bs-primary)',
                        fontWeight: '600',
                        fontFamily: 'var(--font-family-base)',
                    }
                }
            }
        },
        stroke: {
            lineCap: 'round',
        },
        colors: ['var(--bs-primary)'],
    };
    return(
        <Fragment>
            <div id="progressChart">
                <Chart options={options} 
                    series={series} 
                    type="radialBar" 
                    width={250} 
                    
                />
            </div>
        </Fragment>
    )
}
export default DiagnosisReport;