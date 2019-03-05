namespace Send_and_Receive_Messages
{
    partial class mainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.tableLayoutMain = new System.Windows.Forms.TableLayoutPanel();
            this.txtTourURL = new System.Windows.Forms.TextBox();
            this.treeTourStructure = new System.Windows.Forms.TreeView();
            this.txtPlayerConsole = new System.Windows.Forms.TextBox();
            this.txtFormConsole = new System.Windows.Forms.TextBox();
            this.cameraToolbar = new System.Windows.Forms.FlowLayoutPanel();
            this.btnCamLeft = new System.Windows.Forms.Button();
            this.btnCamRight = new System.Windows.Forms.Button();
            this.btnCamUp = new System.Windows.Forms.Button();
            this.btnCamDown = new System.Windows.Forms.Button();
            this.tableLayoutMain.SuspendLayout();
            this.cameraToolbar.SuspendLayout();
            this.SuspendLayout();
            // 
            // tableLayoutMain
            // 
            this.tableLayoutMain.ColumnCount = 2;
            this.tableLayoutMain.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 70F));
            this.tableLayoutMain.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 30F));
            this.tableLayoutMain.Controls.Add(this.txtTourURL, 0, 0);
            this.tableLayoutMain.Controls.Add(this.treeTourStructure, 1, 1);
            this.tableLayoutMain.Controls.Add(this.txtPlayerConsole, 0, 2);
            this.tableLayoutMain.Controls.Add(this.txtFormConsole, 1, 2);
            this.tableLayoutMain.Controls.Add(this.cameraToolbar, 1, 0);
            this.tableLayoutMain.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayoutMain.Location = new System.Drawing.Point(0, 0);
            this.tableLayoutMain.Name = "tableLayoutMain";
            this.tableLayoutMain.RowCount = 3;
            this.tableLayoutMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayoutMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 70F));
            this.tableLayoutMain.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 30F));
            this.tableLayoutMain.Size = new System.Drawing.Size(689, 450);
            this.tableLayoutMain.TabIndex = 0;
            // 
            // txtTourURL
            // 
            this.txtTourURL.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtTourURL.Location = new System.Drawing.Point(3, 3);
            this.txtTourURL.Name = "txtTourURL";
            this.txtTourURL.Size = new System.Drawing.Size(476, 20);
            this.txtTourURL.TabIndex = 0;
            // 
            // treeTourStructure
            // 
            this.treeTourStructure.Dock = System.Windows.Forms.DockStyle.Fill;
            this.treeTourStructure.Location = new System.Drawing.Point(485, 33);
            this.treeTourStructure.Name = "treeTourStructure";
            this.treeTourStructure.Size = new System.Drawing.Size(201, 288);
            this.treeTourStructure.TabIndex = 1;
            this.treeTourStructure.AfterSelect += new System.Windows.Forms.TreeViewEventHandler(this.treeTourStructure_AfterSelect);
            // 
            // txtPlayerConsole
            // 
            this.txtPlayerConsole.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtPlayerConsole.Location = new System.Drawing.Point(3, 327);
            this.txtPlayerConsole.Multiline = true;
            this.txtPlayerConsole.Name = "txtPlayerConsole";
            this.txtPlayerConsole.Size = new System.Drawing.Size(476, 120);
            this.txtPlayerConsole.TabIndex = 2;
            // 
            // txtFormConsole
            // 
            this.txtFormConsole.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtFormConsole.Location = new System.Drawing.Point(485, 327);
            this.txtFormConsole.Multiline = true;
            this.txtFormConsole.Name = "txtFormConsole";
            this.txtFormConsole.Size = new System.Drawing.Size(201, 120);
            this.txtFormConsole.TabIndex = 3;
            // 
            // cameraToolbar
            // 
            this.cameraToolbar.Controls.Add(this.btnCamLeft);
            this.cameraToolbar.Controls.Add(this.btnCamRight);
            this.cameraToolbar.Controls.Add(this.btnCamUp);
            this.cameraToolbar.Controls.Add(this.btnCamDown);
            this.cameraToolbar.Dock = System.Windows.Forms.DockStyle.Fill;
            this.cameraToolbar.Location = new System.Drawing.Point(485, 3);
            this.cameraToolbar.Name = "cameraToolbar";
            this.cameraToolbar.Size = new System.Drawing.Size(201, 24);
            this.cameraToolbar.TabIndex = 4;
            // 
            // btnCamLeft
            // 
            this.btnCamLeft.Location = new System.Drawing.Point(3, 2);
            this.btnCamLeft.Margin = new System.Windows.Forms.Padding(3, 2, 3, 0);
            this.btnCamLeft.Name = "btnCamLeft";
            this.btnCamLeft.Size = new System.Drawing.Size(44, 22);
            this.btnCamLeft.TabIndex = 0;
            this.btnCamLeft.Text = "Left";
            this.btnCamLeft.UseVisualStyleBackColor = true;
            this.btnCamLeft.Click += new System.EventHandler(this.btnCamLeft_Click);
            // 
            // btnCamRight
            // 
            this.btnCamRight.Location = new System.Drawing.Point(53, 2);
            this.btnCamRight.Margin = new System.Windows.Forms.Padding(3, 2, 3, 0);
            this.btnCamRight.Name = "btnCamRight";
            this.btnCamRight.Size = new System.Drawing.Size(44, 22);
            this.btnCamRight.TabIndex = 1;
            this.btnCamRight.Text = "Right";
            this.btnCamRight.UseVisualStyleBackColor = true;
            this.btnCamRight.Click += new System.EventHandler(this.btnCamRight_Click);
            // 
            // btnCamUp
            // 
            this.btnCamUp.Location = new System.Drawing.Point(103, 2);
            this.btnCamUp.Margin = new System.Windows.Forms.Padding(3, 2, 3, 0);
            this.btnCamUp.Name = "btnCamUp";
            this.btnCamUp.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
            this.btnCamUp.Size = new System.Drawing.Size(44, 22);
            this.btnCamUp.TabIndex = 2;
            this.btnCamUp.Text = "Up";
            this.btnCamUp.UseVisualStyleBackColor = true;
            this.btnCamUp.Click += new System.EventHandler(this.btnCamUp_Click);
            // 
            // btnCamDown
            // 
            this.btnCamDown.Location = new System.Drawing.Point(153, 2);
            this.btnCamDown.Margin = new System.Windows.Forms.Padding(3, 2, 3, 0);
            this.btnCamDown.Name = "btnCamDown";
            this.btnCamDown.Size = new System.Drawing.Size(44, 22);
            this.btnCamDown.TabIndex = 3;
            this.btnCamDown.Text = "Down";
            this.btnCamDown.UseVisualStyleBackColor = true;
            this.btnCamDown.Click += new System.EventHandler(this.btnCamDown_Click);
            // 
            // mainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(689, 450);
            this.Controls.Add(this.tableLayoutMain);
            this.Name = "mainForm";
            this.Text = "Cupix Player Events Example";
            this.Load += new System.EventHandler(this.mainForm_Load);
            this.tableLayoutMain.ResumeLayout(false);
            this.tableLayoutMain.PerformLayout();
            this.cameraToolbar.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TableLayoutPanel tableLayoutMain;
        private System.Windows.Forms.TextBox txtTourURL;
        private System.Windows.Forms.TreeView treeTourStructure;
        private System.Windows.Forms.TextBox txtPlayerConsole;
        private System.Windows.Forms.TextBox txtFormConsole;
        private System.Windows.Forms.FlowLayoutPanel cameraToolbar;
        private System.Windows.Forms.Button btnCamLeft;
        private System.Windows.Forms.Button btnCamRight;
        private System.Windows.Forms.Button btnCamUp;
        private System.Windows.Forms.Button btnCamDown;
    }
}

