import React from 'react';

const CliffhangerMeter = ({ score }) => {
    // Assuming score is 0-100
    const normalizedScore = Math.min(Math.max(score || 0, 0), 100);

    let statusText = "Low Tension";
    let statusColor = "text-gray-400";
    let barColor = "bg-gray-400";

    if (normalizedScore > 75) {
        statusText = "Extreme Cliffhanger";
        statusColor = "text-red-500";
        barColor = "bg-red-500";
    } else if (normalizedScore > 50) {
        statusText = "Solid Hook";
        statusColor = "text-yellow-500";
        barColor = "bg-yellow-500";
    } else if (normalizedScore > 25) {
        statusText = "Mild Interest";
        statusColor = "text-blue-400";
        barColor = "bg-blue-400";
    }

    return (
        <div className="w-full">
            <h3 className="text-gray-400 font-bold text-[10px] mb-6 uppercase tracking-[0.2em] flex justify-between">
                Cliffhanger Strength
                <span className={`font-black ${statusColor}`}>{normalizedScore.toFixed(0)} / 100</span>
            </h3>

            <div className="mt-4">
                <div className="flex justify-between text-[10px] text-gray-400 mb-2 w-full font-mono uppercase tracking-widest">
                    <span>Resolving</span>
                    <span className={`${statusColor} font-bold`}>{statusText}</span>
                    <span>Unresolved</span>
                </div>

                {/* Progress bar container */}
                <div className="h-2 w-full bg-[#fafafa] rounded-full overflow-hidden border border-[#f0f0f0]">
                    {/* Animated progress bar fill */}
                    <div
                        className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${normalizedScore}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default CliffhangerMeter;
