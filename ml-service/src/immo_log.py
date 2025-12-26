import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import mlflow

from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, mean_absolute_percentage_error

def evaluate_and_log(model_pipeline, X_test, y_test, feature_names=None):
    predictions = model_pipeline.predict(X_test)
    
# 1. METRICS GENERATION AND LOGGING
    metrics = {
        "mae": mean_absolute_error(y_test, predictions),
        "mse": mean_squared_error(y_test, predictions),
        "rmse": np.sqrt(mean_squared_error(y_test, predictions)),
        "r2_score": r2_score(y_test, predictions),
        "mape": mean_absolute_percentage_error(y_test, predictions)
    }
    
    mlflow.log_metrics(metrics)

    print("\n" + "="*30)
    print("   PIPELINE PERFORMANCE")
    print("="*30)
    print(f"R² Score: {metrics['r2_score']:.2%}")
    print(f"MAE:      +/- {metrics['mae']:.2f} €")
    print(f"RMSE:     +/- {metrics['rmse']:.2f} €")
    print(f"MSE:      +/- {metrics['mse']:.2f} €")
    print(f"MAPE:     {metrics['mape']:.2%}")
    print("="*30)
    
# 2. PLOT VISUALIZATIONS
    
    # Plot A: Actual vs Predicted
    fig1 = plt.figure(figsize=(10, 6))
    plt.scatter(y_test, predictions, alpha=0.3)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    plt.xlabel('Tatsächliche Miete')
    plt.ylabel('Vorhergesagte Miete')
    plt.title('Actual vs. Predicted')
    # plt.savefig("actual_vs_predicted.png")
    # plt.close()
    mlflow.log_figure(fig1, "actual_vs_predicted.png")
    plt.close(fig1)


    # Plot A2: Actual vs Predicted (percentage error)
    pct_error = 100 * (y_test - predictions) / y_test

    fig2 = plt.figure(figsize=(10, 6))
    plt.scatter(y_test, pct_error, alpha=0.3)
    plt.axhline(0, color='red', linestyle='--')
    plt.xlabel('Tatsächliche Miete (€)')
    plt.ylabel('Prozentuale Abweichung (%)')
    plt.title('Relativer Fehler über den Preisverlauf')
    plt.ylim(-100, 100)

    mlflow.log_figure(fig2, "actual_vs_predicted_relative.png")
    plt.close(fig2)


    # Plot B: Residuals Distribution
    residuals = y_test - predictions
    fig3 =plt.figure(figsize=(10, 6))
    sns.histplot(residuals, kde=True, bins=30)
    plt.xlabel('Fehler (Euro)')
    plt.title('Verteilung der Fehler')

    mlflow.log_figure(fig3, "error_distribution.png")
    plt.close(fig3)


    # Plot C: Feature Importance (RandomForest)
    if hasattr(model_pipeline.named_steps['regressor'], 'feature_importances_'):
        rf_model = model_pipeline.named_steps['regressor']
        importances = rf_model.feature_importances_

        preprocessor = model_pipeline.named_steps['preprocessor']
        
        try:
            feature_names = preprocessor.get_feature_names_out()
        except AttributeError:
            feature_names = [f"Feature_{i}" for i in range(len(importances))]

        feat_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importances
        })

        feat_df = feat_df.sort_values(by='Importance', ascending=False).head(20)

        fig4 =plt.figure(figsize=(12, 8))
        plt.barh(feat_df['Feature'], feat_df['Importance'], color='skyblue')
        plt.xlabel('Wichtigkeit (Importance)')
        plt.title('Top 20 Features')
        plt.gca().invert_yaxis()
        plt.tight_layout()

        filename = "feature_importance.png"

        mlflow.log_figure(fig4, filename)
        plt.close(fig4)

        return metrics