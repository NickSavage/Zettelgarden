import React from 'react';
import { fetchPartialCards } from "../api";
import { CardItem } from "../components/CardItem";
import { useState, useEffect } from "react";


export function DashboardPage() {
    const [partialCards, setPartialCards] = React.useState([]);

    useEffect(() => {
        console.log("test")
        fetchPartialCards()
            .then((response) => {
                setPartialCards(response.slice(0, 10));
            })
            .catch((error) => {
                console.error('Error fetching partial cards:', error);
            });
    }, []);

    return (
        <div>
            <h1>Dashboard Page</h1>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1 }}>
                    {partialCards.map((card) => (
                        <div key={card.id} style={{ marginBottom: '10px' }}>
                            <CardItem card={card} />
                        </div>
                    ))}
                </div>
                <div style={{ flex: 1 }}>
                    {/* Add your second table content here */}
                <div style={{ flex: 1 }}>
                    {partialCards.map((card) => (
                        <div key={card.id} style={{ marginBottom: '10px' }}>
                            <CardItem card={card} />
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
};
