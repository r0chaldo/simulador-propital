import React, { useState } from "react";
import { NumericFormat } from "react-number-format";
import "./Simulador.css";

// Importación de Chart.js y react-chartjs-2 (si ya lo tienes integrado)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function Simulador() {
  // Estado para las propiedades (cada objeto representa una propiedad)
  const [properties, setProperties] = useState([
    {
      precio_propiedad: 100000,
      pie: 20000,
      tasa_anual: 5,
      plazo_anos: 25,
      arriendo_mensual: 500,
      gastos_admin: 50,
      vacancia: 0.02, // Se almacena como decimal (0.02 = 2%)
      tasa_plusvalia: 0.05, // Se almacena como decimal (0.05 = 5%)
    },
  ]);

  // Estado para almacenar los resultados de la simulación de cada propiedad.
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Funciones de formateo para el output (separador de miles y moneda)
  const formatNumber = (num) =>
    new Intl.NumberFormat("es-ES").format(num);
  const formatCurrency = (num) => "$" + formatNumber(num);

  // Actualiza el valor del input para una propiedad en particular.
  const handleChange = (index, e) => {
    const updatedProperties = properties.map((prop, i) =>
      i === index
        ? { ...prop, [e.target.name]: parseFloat(e.target.value) }
        : prop
    );
    setProperties(updatedProperties);
  };

  // Agrega una nueva propiedad con valores por defecto.
  const addProperty = () => {
    setProperties([
      ...properties,
      {
        precio_propiedad: 100000,
        pie: 20000,
        tasa_anual: 5,
        plazo_anos: 25,
        arriendo_mensual: 500,
        gastos_admin: 50,
        vacancia: 0.02,
        tasa_plusvalia: 0.05,
      },
    ]);
  };

  // Elimina la propiedad indicada y su resultado.
  const removeProperty = (index) => {
    setProperties(properties.filter((_, i) => i !== index));
    setResultados(resultados.filter((_, i) => i !== index));
  };

  // Envía los datos a la API para cada propiedad y guarda los resultados.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const results = await Promise.all(
        properties.map(async (property) => {
          const response = await fetch("http://127.0.0.1:5000/simular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(property),
          });
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          return response.json();
        })
      );
      setResultados(results);
    } catch (error) {
      console.error("Error al enviar datos:", error);
    }
    setLoading(false);
  };

  // Cálculos globales
  const totalPrecioPropiedades = properties.reduce(
    (acc, prop) => acc + prop.precio_propiedad,
    0
  );
  const pieTotal = properties.reduce((acc, prop) => acc + prop.pie, 0);
  const totalCapitalGain =
    resultados.length > 0
      ? resultados.reduce(
          (acc, r, index) =>
            acc + (r.valor_futuro - properties[index].precio_propiedad),
          0
        )
      : 0;
  const avgCapRate =
    resultados.length > 0
      ? resultados.reduce((acc, r) => acc + r.cap_rate, 0) / resultados.length
      : 0;
  const avgCashOnCash =
    resultados.length > 0
      ? resultados.reduce((acc, r) => acc + r.cash_on_cash, 0) / resultados.length
      : 0;
  const totalCuotaMensual = resultados.reduce(
    (acc, r) => acc + r.cuota_mensual,
    0
  );
  const totalValorFuturo = resultados.reduce(
    (acc, r) => acc + r.valor_futuro,
    0
  );

  // Datos para el gráfico de barras (Cap Rate y Cash on Cash)
  const barLabels = properties.map((_, index) => `Propiedad ${index + 1}`);
  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: "Cap Rate (%)",
        data: resultados.map((r) => r.cap_rate),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Cash on Cash (%)",
        data: resultados.map((r) => r.cash_on_cash),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Indicadores de Inversión",
      },
    },
  };

  // Datos para el gráfico de líneas (Evolución del Valor de la Propiedad a 5 años)
  const years = [0, 1, 2, 3, 4, 5];
  const lineChartData = {
    labels: years,
    datasets: properties.map((prop, idx) => {
      const data = years.map(
        (year) =>
          prop.precio_propiedad *
          Math.pow(1 + prop.tasa_plusvalia, year)
      );
      const colors = [
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(153, 102, 255, 0.6)",
        "rgba(255, 159, 64, 0.6)",
      ];
      return {
        label: `Propiedad ${idx + 1}`,
        data: data,
        fill: false,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length],
        tension: 0.1,
      };
    }),
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Evolución del Valor de la Propiedad (años)",
      },
    },
  };

  return (
    <div className="container">
      <h2>Simulador de Inversión Inmobiliaria</h2>
      <form onSubmit={handleSubmit}>
        {properties.map((prop, index) => (
          <div key={index} className="card">
            {/* Columna Izquierda: Inputs */}
            <div className="property-inputs">
              <h3>Propiedad {index + 1}</h3>
              <div className="input-group">
                <label>Precio Propiedad:</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.precio_propiedad}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: {
                        name: "precio_propiedad",
                        value: floatValue,
                      },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Pie:</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.pie}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: { name: "pie", value: floatValue },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Tasa Anual (%):</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.tasa_anual}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: { name: "tasa_anual", value: floatValue },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Plazo (años):</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.plazo_anos}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: { name: "plazo_anos", value: floatValue },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Arriendo Mensual:</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.arriendo_mensual}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: { name: "arriendo_mensual", value: floatValue },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Gastos Admin:</label>
                <NumericFormat
                  thousandSeparator={true}
                  value={prop.gastos_admin}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: { name: "gastos_admin", value: floatValue },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Vacancia:</label>
                <NumericFormat
                  value={prop.vacancia * 100} // Se muestra en formato %
                  suffix="%"
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: {
                        name: "vacancia",
                        value: floatValue ? floatValue / 100 : 0,
                      },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              <div className="input-group">
                <label>Tasa Plusvalia:</label>
                <NumericFormat
                  value={prop.tasa_plusvalia * 100} // Se muestra en formato %
                  suffix="%"
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={({ floatValue }) =>
                    handleChange(index, {
                      target: {
                        name: "tasa_plusvalia",
                        value: floatValue ? floatValue / 100 : 0,
                      },
                    })
                  }
                  className="input-field"
                  required
                  displayType="input"
                />
              </div>
              {properties.length > 1 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => removeProperty(index)}
                >
                  Eliminar Propiedad
                </button>
              )}
            </div>

            {/* Columna Derecha: Resultados individuales */}
            <div className="property-result">
              {resultados[index] ? (
                <div className="result-card">
                  <h4>Resultados</h4>
                  <p>
                    <strong>Cap Rate:</strong>{" "}
                    {formatNumber(resultados[index].cap_rate)}%
                  </p>
                  <p>
                    <strong>Cash on Cash:</strong>{" "}
                    {formatNumber(resultados[index].cash_on_cash)}%
                  </p>
                  <p>
                    <strong>Cuota Mensual:</strong>{" "}
                    {formatCurrency(resultados[index].cuota_mensual)}
                  </p>
                  <p>
                    <strong>Valor Futuro:</strong>{" "}
                    {formatCurrency(resultados[index].valor_futuro)}
                  </p>
                  <p>
                    <strong>Ganancia de Capital:</strong>{" "}
                    {formatCurrency(
                      resultados[index].valor_futuro - prop.precio_propiedad
                    )}
                  </p>
                </div>
              ) : (
                <div className="result-card-placeholder">
                  Resultados no disponibles
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="action-buttons">
          <button type="button" className="btn" onClick={addProperty}>
            Agregar Propiedad
          </button>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Calculando..." : "Simular"}
          </button>
        </div>
      </form>

      {/* Resumen Global */}
      {resultados && resultados.length > 0 && (
        <div className="summary-card">
          <h3>Resumen Global</h3>
          <p>
            <strong>Precio Total Propiedades:</strong>{" "}
            {formatCurrency(totalPrecioPropiedades)}
          </p>
          <p>
            <strong>Pie Total:</strong> {formatCurrency(pieTotal)}
          </p>
          <p>
            <strong>Ganancia de Capital Total:</strong>{" "}
            {formatCurrency(totalCapitalGain)}
          </p>
          <p>
            <strong>Cap Rate Promedio:</strong> {formatNumber(avgCapRate)}%
          </p>
          <p>
            <strong>Cash on Cash Promedio:</strong>{" "}
            {formatNumber(avgCashOnCash)}%
          </p>
          <p>
            <strong>Cuota Mensual Total:</strong>{" "}
            {formatCurrency(totalCuotaMensual)}
          </p>
          <p>
            <strong>Valor Futuro Total:</strong>{" "}
            {formatCurrency(totalValorFuturo)}
          </p>
        </div>
      )}

      {/* Gráficos (se muestran solo si hay resultados) */}
      {resultados && resultados.length > 0 && (
        <div className="charts">
          <div className="chart-container">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
          <div className="chart-container">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Simulador;
